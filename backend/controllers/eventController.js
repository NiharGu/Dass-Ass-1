const Event = require("../models/events");
const User = require("../models/User");

// Organizer creates event
exports.createEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "organizer") {
      return res.status(403).json({ message: "Only organizers can create events" });
    }

    const event = await Event.create({
      ...req.body,
      organizer: user._id
    });

    res.status(201).json(event);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// Public browse
exports.getAllEvents = async (req, res) => {
  const events = await Event.find().populate("organizer");
  res.json(events);
};

// Event details
exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate("organizer");
  res.json(event);
};

// Organizer dashboard
exports.getOrganizerEvents = async (req, res) => {
  const events = await Event.find({
    organizer: req.user.userId
  });
  res.json(events);
};
