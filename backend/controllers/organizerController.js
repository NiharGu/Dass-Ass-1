const User = require("../models/User");
const Event = require("../models/events");

// Get all approved organizers
exports.getAllOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({
      role: "organizer",
      isApproved: true
    }).select("-password");

    res.json(organizers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get organizer details with events
exports.getOrganizerById = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id).select("-password");

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (!organizer.isApproved) {
      return res.status(403).json({ message: "Organizer is not approved" });
    }

    // Get organizer's events with optional filter (only show published to public)
    const { filter } = req.query; // "upcoming" or "past"
    let eventQuery = { organizer: organizer._id, status: "published" };

    if (filter === "upcoming") {
      eventQuery.StartDate = { $gte: new Date() };
    } else if (filter === "past") {
      eventQuery.EndDate = { $lt: new Date() };
    }

    const events = await Event.find(eventQuery).sort({ StartDate: -1 });

    res.json({
      organizer,
      events
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Follow an organizer
exports.followOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const organizer = await User.findById(req.params.id);

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (!organizer.isApproved) {
      return res.status(403).json({ message: "Cannot follow unapproved organizer" });
    }

    // Check if already following
    if (user.followedClubs.includes(organizer._id)) {
      return res.status(400).json({ message: "Already following this organizer" });
    }

    user.followedClubs.push(organizer._id);
    await user.save();

    res.json({ message: "Successfully followed organizer" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Unfollow an organizer
exports.unfollowOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const organizer = await User.findById(req.params.id);

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Check if not following
    if (!user.followedClubs.includes(organizer._id)) {
      return res.status(400).json({ message: "Not following this organizer" });
    }

    user.followedClubs = user.followedClubs.filter(
      clubId => !clubId.equals(organizer._id)
    );
    await user.save();

    res.json({ message: "Successfully unfollowed organizer" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
