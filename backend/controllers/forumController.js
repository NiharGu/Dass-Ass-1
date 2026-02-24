const Message = require("../models/Message");
const Event = require("../models/events");
const Registration = require("../models/Registration");

// Get messages for an event
exports.getMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const messages = await Message.find({ event: eventId })
            .populate("author", "firstName lastName organizerName role email")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Post a message
exports.postMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content, parentMessage, isAnnouncement } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Must be registered or be the organizer to post
        const isOrganizer = event.organizer.equals(req.user.userId);
        if (!isOrganizer) {
            const reg = await Registration.findOne({
                participant: req.user.userId, event: eventId, status: "registered"
            });
            if (!reg) return res.status(403).json({ message: "Only registered participants and the organizer can post" });
        }

        const message = await Message.create({
            event: eventId,
            author: req.user.userId,
            content: content.trim(),
            parentMessage: parentMessage || null,
            isAnnouncement: isOrganizer && isAnnouncement ? true : false
        });

        await message.populate("author", "firstName lastName organizerName role email");

        // Emit via socket.io if available
        const io = req.app.get("io");
        if (io) {
            io.to(`event-${eventId}`).emit("newMessage", message);
        }

        // Create in-app notification if it's an announcement
        if (message.isAnnouncement) {
            try {
                const Notification = require("../models/Notification");
                const registrations = await Registration.find({
                    event: eventId,
                    status: "registered"
                });

                const notifications = registrations.map(reg => ({
                    user: reg.participant,
                    type: "announcement",
                    event: eventId,
                    title: `Announcement for ${event.Name} by ${message.author.organizerName || "Organizer"}`,
                    content: content.trim(),
                    link: `/events/${eventId}`
                }));

                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);
                }
            } catch (err) {
                console.error("Failed to create announcement notifications:", err);
            }
        }

        res.status(201).json(message);
    } catch (error) {
        console.error("Post message error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a message (organizer moderation)
exports.deleteMessage = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        // Only organizer or message author can delete
        const isOrganizer = event.organizer.equals(req.user.userId);
        const isAuthor = message.author.equals(req.user.userId);
        if (!isOrganizer && !isAuthor) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await message.deleteOne();

        const io = req.app.get("io");
        if (io) {
            io.to(`event-${eventId}`).emit("messageDeleted", messageId);
        }

        res.json({ message: "Message deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Pin/unpin a message (organizer only)
exports.togglePin = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!event.organizer.equals(req.user.userId)) {
            return res.status(403).json({ message: "Only the organizer can pin messages" });
        }

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        message.isPinned = !message.isPinned;
        await message.save();

        const io = req.app.get("io");
        if (io) {
            io.to(`event-${eventId}`).emit("messagePinned", { messageId, isPinned: message.isPinned });
        }

        res.json({ message: message.isPinned ? "Message pinned" : "Message unpinned", isPinned: message.isPinned });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// React to a message
exports.reactToMessage = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const { emoji } = req.body;

        if (!emoji) return res.status(400).json({ message: "Emoji is required" });

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        const userId = req.user.userId;
        const currentReactions = message.reactions.get(emoji) || [];

        if (currentReactions.some(id => id.toString() === userId)) {
            // Remove reaction
            message.reactions.set(emoji, currentReactions.filter(id => id.toString() !== userId));
            if (message.reactions.get(emoji).length === 0) message.reactions.delete(emoji);
        } else {
            // Add reaction
            currentReactions.push(userId);
            message.reactions.set(emoji, currentReactions);
        }

        await message.save();

        const io = req.app.get("io");
        if (io) {
            io.to(`event-${eventId}`).emit("messageReaction", { messageId, reactions: Object.fromEntries(message.reactions) });
        }

        res.json({ reactions: Object.fromEntries(message.reactions) });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
