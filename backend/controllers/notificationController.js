const Notification = require("../models/Notification");

// Get user notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.userId, isRead: false })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json(notification);
    } catch (error) {
        console.error("Mark notification as read error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.userId, isRead: false },
            { isRead: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all notifications as read error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
