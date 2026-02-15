const Event = require("../models/events");
const User = require("../models/User");
const Registration = require("../models/Registration");

// Organizer creates event
exports.createEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "organizer") {
      return res.status(403).json({ message: "Only organizers can create events" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "Your organizer account is pending approval. Please wait for admin approval." });
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

// Public browse with search and filters
exports.getAllEvents = async (req, res) => {
  try {
    const { search, eventType, eligibility, startDate, endDate, followedClubs } = req.query;
    
    let query = {};

    // Search: partial/fuzzy matching on event name or organizer name
    if (search) {
      const organizers = await User.find({
        organizerName: { $regex: search, $options: "i" },
        role: "organizer"
      }).select("_id");
      
      const organizerIds = organizers.map(org => org._id);
      
      query.$or = [
        { Name: { $regex: search, $options: "i" } },
        { organizer: { $in: organizerIds } }
      ];
    }

    // Filter by event type
    if (eventType) {
      query.Type = eventType; // "normal" or "merchandise"
    }

    // Filter by eligibility
    if (eligibility) {
      query.eligibility = eligibility; // "iiit-only", "non-iiit", "open"
    }

    // Filter by date range
    if (startDate || endDate) {
      query.StartDate = {};
      if (startDate) query.StartDate.$gte = new Date(startDate);
      if (endDate) query.StartDate.$lte = new Date(endDate);
    }

    // Filter by followed clubs (if user is authenticated)
    if (followedClubs) {
      const clubIds = followedClubs.split(",");
      query.organizer = { $in: clubIds };
    }

    const events = await Event.find(query)
      .populate("organizer", "-password")
      .sort({ StartDate: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Event details
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "-password");
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Organizer dashboard
exports.getOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({
      organizer: req.user.userId
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Trending events (top 5 in last 24 hours by registration count)
exports.getTrendingEvents = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get registrations from last 24 hours
    const recentRegistrations = await Registration.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours },
          status: "registered"
        }
      },
      {
        $group: {
          _id: "$event",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const eventIds = recentRegistrations.map(r => r._id);
    const events = await Event.find({ _id: { $in: eventIds } })
      .populate("organizer", "-password");

    // Sort by registration count
    const sortedEvents = events.map(event => {
      const regData = recentRegistrations.find(r => r._id.equals(event._id));
      return {
        ...event.toObject(),
        registrationCount: regData ? regData.count : 0
      };
    }).sort((a, b) => b.registrationCount - a.registrationCount);

    res.json(sortedEvents);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
