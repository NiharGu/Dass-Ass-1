const Registration = require("../models/Registration");
const Event = require("../models/events");
const User = require("../models/User");

exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const user = await User.findById(req.user.userId);

    // Check eligibility
    if (event.eligibility === "iiit-only" && user.participantType !== "iiit") {
      return res.status(403).json({ message: "This event is only for IIIT students" });
    }
    if (event.eligibility === "non-iiit" && user.participantType === "iiit") {
      return res.status(403).json({ message: "This event is only for non-IIIT participants" });
    }

    // Check registration limit
    const registrationCount = await Registration.countDocuments({
      event: event._id,
      status: "registered"
    });
    
    if (registrationCount >= event.registrationLimit) {
      return res.status(400).json({ message: "Registration limit reached" });
    }

    // Validate customForm responses for normal events
    if (event.Type === "normal" && event.customForm) {
      const formResponses = req.body.formResponses || {};
      
      for (const field of event.customForm) {
        if (field.required && !formResponses[field.name]) {
          return res.status(400).json({ 
            message: `Missing required field: ${field.name}` 
          });
        }
      }
    }

    const registration = await Registration.create({
      participant: req.user.userId,
      event: event._id,
      formResponses: req.body.formResponses || {}
    });

    res.status(201).json(registration);

  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.registrationId,
      participant: req.user.userId,
      status: "registered"
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found or already cancelled" });
    }

    registration.status = "cancelled";
    await registration.save();

    res.json({ message: "Registration cancelled successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
