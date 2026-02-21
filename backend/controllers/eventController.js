// Delete a draft event (organizer only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your event" });
    }
    if (event.status !== "draft") {
      return res.status(400).json({ message: "Only draft events can be deleted" });
    }
    await event.deleteOne();
    res.json({ message: "Draft event deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const Event = require("../models/events");
const User = require("../models/User");
const Registration = require("../models/Registration");

// Helper: Post to Discord webhook
const postToDiscord = async (webhookUrl, event, organizer) => {
  try {
    const payload = {
      embeds: [{
        title: `🎉 New Event: ${event.Name}`,
        description: event.Description.substring(0, 200) + (event.Description.length > 200 ? "..." : ""),
        color: 0x5865F2,
        fields: [
          { name: "Type", value: event.Type, inline: true },
          { name: "Eligibility", value: event.eligibility, inline: true },
          { name: "Fee", value: `₹${event.registrationFee}`, inline: true },
          { name: "Start", value: new Date(event.StartDate).toLocaleString(), inline: true },
          { name: "End", value: new Date(event.EndDate).toLocaleString(), inline: true },
          { name: "Deadline", value: new Date(event.registrationDeadline).toLocaleString(), inline: true },
          { name: "Organizer", value: organizer.organizerName || "Unknown", inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Discord webhook failed:", error.message);
    // Don't throw - event publishing should still succeed
  }
};

// Organizer creates event (starts as draft)
exports.createEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== "organizer") {
      return res.status(403).json({ message: "Only organizers can create events" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "Your organizer account has been disabled. Contact admin." });
    }
    if (req.body.status === "published") {
      // Date validation
      const { StartDate, EndDate, registrationDeadline } = req.body;
      const now = new Date();

      if (!StartDate || !EndDate || !registrationDeadline) {
        return res.status(400).json({ message: "All date fields are required for published events" });
      }
      if (new Date(StartDate) <= now) {
        return res.status(400).json({ message: "Start date must be in the future" });
      }
      if (new Date(EndDate) <= now) {
        return res.status(400).json({ message: "End date must be in the future" });
      }
      if (new Date(EndDate) <= new Date(StartDate)) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
      if (new Date(registrationDeadline) > new Date(EndDate)) {
        return res.status(400).json({ message: "Registration deadline cannot be after end date" });
      }

      const event = await Event.create({
        ...req.body,
        organizer: user._id,
        status: "published"
      });

      if (user.discordWebhookUrl) {
        await postToDiscord(user.discordWebhookUrl, event, user);
      }
      res.status(201).json(event);
    } else {
      const event = await Event.create({
        ...req.body,
        organizer: user._id,
        status: "draft"
      });

      res.status(201).json(event);
    }


  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Publish a draft event
exports.publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your event" });
    }

    const user = await User.findById(req.user.userId);
    if (!user.isApproved) {
      return res.status(403).json({ message: "Your account is disabled. You cannot publish events." });
    }

    if (event.status !== "draft") {
      return res.status(400).json({ message: "Only draft events can be published" });
    }

    // Date validation (same as updateEvent)
    const now = new Date();
    if (!event.StartDate || !event.EndDate || !event.registrationDeadline) {
      return res.status(400).json({ message: "All date fields are required" });
    }
    if (event.StartDate <= now) {
      return res.status(400).json({ message: "Start date must be in the future" });
    }
    if (event.EndDate <= now) {
      return res.status(400).json({ message: "End date must be in the future" });
    }
    if (event.EndDate <= event.StartDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }
    if (event.registrationDeadline > event.EndDate) {
      return res.status(400).json({ message: "Registration deadline cannot be after end date" });
    }

    event.status = "published";
    await event.save();

    // Auto-post to Discord if organizer has webhook configured
    if (user.discordWebhookUrl) {
      await postToDiscord(user.discordWebhookUrl, event, user);
    }

    res.json({ message: "Event published successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Edit event (with rules per Section 10.4)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your event" });
    }

    const user = await User.findById(req.user.userId);
    if (!user.isApproved) {
      return res.status(403).json({ message: "Your account is disabled. You cannot edit events." });
    }

    // Validate StartDate and EndDate if provided (applies to both draft and published)
    const { StartDate, EndDate } = req.body;
    const now = new Date();

    if (StartDate !== undefined || EndDate !== undefined) {
      const newStart = StartDate ? new Date(StartDate) : event.StartDate;
      const newEnd = EndDate ? new Date(EndDate) : event.EndDate;

      if (newStart <= now) {
        return res.status(400).json({ message: "Start date must be in the future" });
      }
      if (newEnd <= now) {
        return res.status(400).json({ message: "End date must be in the future" });
      }
      if (newEnd <= newStart) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
    }

    if (event.status === "draft") {
      // Draft: free edits on all fields
      const updates = req.body;
      Object.keys(updates).forEach(key => {
        if (key !== "organizer" && key !== "status") {
          event[key] = updates[key];
        }
      });
    } else if (event.status === "published") {
      // Published event: allow edits before or during the event, but restrict fields
      const now = new Date();
      const { Description, registrationDeadline, registrationLimit } = req.body;

      // If event is completed (now > EndDate), block all edits
      if (now > event.EndDate) {
        return res.status(400).json({ message: "Completed events cannot be edited" });
      }

      // If event is ongoing (now >= StartDate && now <= EndDate), only allow Description and extending registrationDeadline
      if (now >= event.StartDate && now <= event.EndDate) {
        if (Description !== undefined) event.Description = Description;
        if (registrationDeadline !== undefined) {
          const newDeadline = new Date(registrationDeadline);
          if (newDeadline >= event.registrationDeadline && newDeadline <= event.EndDate) {
            event.registrationDeadline = newDeadline;
          } else {
            return res.status(400).json({ message: "Can only extend the deadline, not shorten it, and it cannot go past event end date" });
          }
        }
        // Block changes to StartDate, EndDate, registrationLimit
        if (StartDate !== undefined || EndDate !== undefined || registrationLimit !== undefined) {
          return res.status(400).json({ message: "Cannot change start/end date or registration limit during ongoing event" });
        }
      } else {
        // Not started yet: allow description, extend deadline, increase limit, and dates
        if (Description !== undefined) event.Description = Description;
        if (StartDate !== undefined) event.StartDate = new Date(StartDate);
        if (EndDate !== undefined) event.EndDate = new Date(EndDate);
        if (registrationDeadline !== undefined) {
          const newDeadline = new Date(registrationDeadline);
          if (newDeadline >= event.registrationDeadline && newDeadline <= (EndDate ? new Date(EndDate) : event.EndDate)) {
            event.registrationDeadline = newDeadline;
          } else {
            return res.status(400).json({ message: "Can only extend the deadline, not shorten it, and it cannot go past event end date" });
          }
        }
        if (registrationLimit !== undefined) {
          if (registrationLimit >= event.registrationLimit) {
            event.registrationLimit = registrationLimit;
          } else {
            return res.status(400).json({ message: "Can only increase the registration limit" });
          }
        }
      }
    } else {
      // Closed: no edits
      return res.status(400).json({ message: "Closed events cannot be edited" });
    }

    await event.save();
    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Close event (stop registrations)
exports.closeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your event" });
    }

    const user = await User.findById(req.user.userId);
    if (!user.isApproved) {
      return res.status(403).json({ message: "Your account is disabled. You cannot close events." });
    }

    if (event.status === "draft") {
      return res.status(400).json({ message: "Cannot close a draft event. Publish it first." });
    }

    event.status = "closed";
    await event.save();

    res.json({ message: "Event closed successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Public browse with search and filters
exports.getAllEvents = async (req, res) => {
  try {
    const { search, eventType, eligibility, startDate, endDate, followedClubs } = req.query;

    let query = { status: "published" }; // Only show published events publicly

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

    let events = await Event.find(query)
      .populate("organizer", "-password")
      .sort({ StartDate: 1 });

    // Preference-based ordering for participants
    if (req.user && req.user.role === "participant") {
      const user = await User.findById(req.user.userId);
      if (user) {
        events = events.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          if (a.organizer) {
            if (user.followedClubs && user.followedClubs.some(id => id.equals(a.organizer._id))) scoreA += 10;
            if (user.selectedInterests && a.organizer.category && Array.isArray(a.organizer.category) &&
              a.organizer.category.some(cat => user.selectedInterests.includes(cat))) scoreA += 5;
          }
          if (b.organizer) {
            if (user.followedClubs && user.followedClubs.some(id => id.equals(b.organizer._id))) scoreB += 10;
            if (user.selectedInterests && b.organizer.category && Array.isArray(b.organizer.category) &&
              b.organizer.category.some(cat => user.selectedInterests.includes(cat))) scoreB += 5;
          }

          if (scoreB !== scoreA) {
            return scoreB - scoreA; // Highest score first
          }
          return new Date(a.StartDate) - new Date(b.StartDate); // Fallback to StartDate
        });
      }
    }

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
    const events = await Event.find({ _id: { $in: eventIds }, status: "published" })
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

// Organizer dashboard analytics (Section 10.2)
exports.getOrganizerDashboard = async (req, res) => {
  try {
    const organizerId = req.user.userId;

    const events = await Event.find({ organizer: organizerId });
    const eventIds = events.map(e => e._id);

    // Get all registrations for organizer's events
    const registrations = await Registration.find({ event: { $in: eventIds } });

    const activeRegistrations = registrations.filter(r => r.status === "registered");

    // Per-event analytics
    const eventAnalytics = await Promise.all(events.map(async (event) => {
      const eventRegs = registrations.filter(r => r.event.equals(event._id));
      const activeRegs = eventRegs.filter(r => r.status === "registered");
      const cancelledRegs = eventRegs.filter(r => r.status === "cancelled");

      // Revenue: registration fee * active registrations
      const revenue = activeRegs.length * (event.registrationFee || 0);

      // Merchandise sales count
      let merchandiseSales = 0;
      if (event.Type === "merchandise") {
        activeRegs.forEach(reg => {
          if (reg.merchandiseSelections) {
            reg.merchandiseSelections.forEach(item => {
              merchandiseSales += item.quantity || 0;
            });
          }
        });
      }

      return {
        eventId: event._id,
        eventName: event.Name,
        type: event.Type,
        status: event.status,
        startDate: event.StartDate,
        endDate: event.EndDate,
        totalRegistrations: activeRegs.length,
        cancelledRegistrations: cancelledRegs.length,
        registrationLimit: event.registrationLimit,
        revenue,
        merchandiseSales
      };
    }));

    // Summary totals
    const totalEvents = events.length;
    const draftEvents = events.filter(e => e.status === "draft").length;
    const publishedEvents = events.filter(e => e.status === "published").length;
    const closedEvents = events.filter(e => e.status === "closed").length;
    const totalRegistrations = activeRegistrations.length;
    const totalRevenue = eventAnalytics.reduce((sum, e) => sum + e.revenue, 0);
    const totalMerchandiseSales = eventAnalytics.reduce((sum, e) => sum + e.merchandiseSales, 0);

    res.json({
      summary: {
        totalEvents,
        draftEvents,
        publishedEvents,
        closedEvents,
        totalRegistrations,
        totalRevenue,
        totalMerchandiseSales
      },
      events: eventAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get participants for an event (Organizer view - Section 10.3)
exports.getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your event" });
    }

    const { search, status } = req.query;

    let regQuery = { event: event._id };

    // Filter by registration status
    if (status === "registered" || status === "cancelled") {
      regQuery.status = status;
    }

    let registrations = await Registration.find(regQuery)
      .populate("participant", "-password")
      .sort({ createdAt: -1 });

    // Search by participant name or email
    if (search) {
      const searchLower = search.toLowerCase();
      registrations = registrations.filter(reg => {
        if (!reg.participant) return false;
        const name = `${reg.participant.firstName || ""} ${reg.participant.lastName || ""}`.toLowerCase();
        const email = (reg.participant.email || "").toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Format response
    const participants = registrations.map(reg => ({
      registrationId: reg._id,
      ticketId: reg.ticketId,
      participantName: reg.participant
        ? `${reg.participant.firstName || ""} ${reg.participant.lastName || ""}`.trim()
        : "[Deleted User]",
      participantEmail: reg.participant ? reg.participant.email : "N/A",
      registrationDate: reg.createdAt,
      status: reg.status,
      formResponses: reg.formResponses,
      merchandiseSelections: reg.merchandiseSelections
    }));

    res.json({
      eventName: event.Name,
      totalParticipants: participants.filter(p => p.status === "registered").length,
      participants
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Export event participants as CSV (Organizer - Section 10.3)
exports.exportEventParticipantsCSV = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.organizer.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your event" });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate("participant", "-password")
      .sort({ createdAt: -1 });

    // Build CSV
    const headers = ["Ticket ID", "Name", "Email", "Registration Date", "Status"];

    if (event.Type === "merchandise") {
      headers.push("Merchandise Selections");
    }

    const rows = registrations.map(reg => {
      const name = reg.participant
        ? `${reg.participant.firstName || ""} ${reg.participant.lastName || ""}`.trim()
        : "Deleted User";
      const email = reg.participant ? reg.participant.email : "N/A";

      const row = [
        reg.ticketId,
        `"${name}"`,
        email,
        new Date(reg.createdAt).toISOString(),
        reg.status
      ];

      if (event.Type === "merchandise" && reg.merchandiseSelections) {
        const items = reg.merchandiseSelections
          .map(s => `${s.itemName} (${s.size}/${s.color}) x${s.quantity}`)
          .join("; ");
        row.push(`"${items}"`);
      }

      return row.join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${event.Name}-participants.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
