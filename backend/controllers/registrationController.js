const Registration = require("../models/Registration");
const Event = require("../models/events");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send ticket email with QR code
const sendTicketEmail = async (user, event, registration, qrCodeDataURL) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Registration Confirmed - ${event.Name}`,
      html: `
        <h2>Registration Successful!</h2>
        <p>Dear ${user.firstName || user.email},</p>
        <p>You have successfully registered for <strong>${event.Name}</strong>.</p>
        
        <h3>Event Details:</h3>
        <ul>
          <li><strong>Event:</strong> ${event.Name}</li>
          <li><strong>Type:</strong> ${event.Type}</li>
          <li><strong>Start Date:</strong> ${new Date(event.StartDate).toLocaleString()}</li>
          <li><strong>End Date:</strong> ${new Date(event.EndDate).toLocaleString()}</li>
          <li><strong>Ticket ID:</strong> ${registration.ticketId}</li>
        </ul>
        
        <h3>Your Ticket QR Code:</h3>
        <img src="${qrCodeDataURL}" alt="Ticket QR Code" style="width: 200px; height: 200px;"/>
        
        <p>Please present this QR code at the event venue for entry.</p>
        
        <p>Thank you for registering!</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't throw error - registration should still succeed even if email fails
  }
};

exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    const user = await User.findById(req.user.userId);

    // Check eligibility
    if (event.eligibility === "iiit-only" && user.participantType !== "iiit") {
      return res.status(403).json({ message: "This event is only for IIIT students" });
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

    let merchandiseSelections = [];
    
    // Handle merchandise events
    if (event.Type === "merchandise") {
      const requestedItems = req.body.merchandiseSelections || [];
      
      if (requestedItems.length === 0) {
        return res.status(400).json({ message: "Please select at least one merchandise item" });
      }

      // Validate stock and purchase limit for each requested item
      for (const requestedItem of requestedItems) {
        const eventItem = event.merchandiseDetails.items.find(
          item => item.name === requestedItem.itemName && 
                  item.size === requestedItem.size && 
                  item.color === requestedItem.color
        );

        if (!eventItem) {
          return res.status(400).json({ 
            message: `Item not found: ${requestedItem.itemName} (${requestedItem.size}, ${requestedItem.color})` 
          });
        }

        // Check per-item purchase limit
        if (eventItem.purchaseLimit && requestedItem.quantity > eventItem.purchaseLimit) {
          return res.status(400).json({ 
            message: `Purchase limit for ${requestedItem.itemName} is ${eventItem.purchaseLimit} per participant` 
          });
        }

        if (eventItem.stock < requestedItem.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${requestedItem.itemName}. Available: ${eventItem.stock}` 
          });
        }
      }

      // Decrement stock for each item
      for (const requestedItem of requestedItems) {
        const itemIndex = event.merchandiseDetails.items.findIndex(
          item => item.name === requestedItem.itemName && 
                  item.size === requestedItem.size && 
                  item.color === requestedItem.color
        );

        if (itemIndex !== -1) {
          event.merchandiseDetails.items[itemIndex].stock -= requestedItem.quantity;
        }
      }

      await event.save();
      merchandiseSelections = requestedItems;
    }

    // Generate unique ticket ID
    const ticketId = uuidv4();

    // Create registration
    const registration = await Registration.create({
      participant: req.user.userId,
      event: event._id,
      ticketId,
      formResponses: req.body.formResponses || {},
      merchandiseSelections
    });

    // Populate for response
    await registration.populate("event");
    await registration.populate("participant", "-password");

    // Generate QR Code
    const qrData = {
      ticketId: registration.ticketId,
      eventId: event._id,
      eventName: event.Name,
      participantId: user._id,
      participantEmail: user.email
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

    // Send ticket email
    await sendTicketEmail(user, event, registration, qrCodeDataURL);

    res.status(201).json({
      ...registration.toObject(),
      qrCode: qrCodeDataURL
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.registrationId,
      participant: req.user.userId,
      status: "registered"
    }).populate("event");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found or already cancelled" });
    }

    // Restore stock for merchandise events
    if (registration.event.Type === "merchandise" && registration.merchandiseSelections?.length > 0) {
      const event = registration.event;

      for (const purchasedItem of registration.merchandiseSelections) {
        const itemIndex = event.merchandiseDetails.items.findIndex(
          item => item.name === purchasedItem.itemName && 
                  item.size === purchasedItem.size && 
                  item.color === purchasedItem.color
        );

        if (itemIndex !== -1) {
          event.merchandiseDetails.items[itemIndex].stock += purchasedItem.quantity;
        }
      }

      await event.save();
    }

    registration.status = "cancelled";
    await registration.save();

    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Cancellation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getParticipantRegistrations = async (req, res) => {
  try {
    const { filter } = req.query; // "upcoming", "past", "normal", "merchandise", "completed", "cancelled"
    
    let query = { participant: req.user.userId };
    
    // Filter by status
    if (filter === "completed") {
      query.status = "registered";
    } else if (filter === "cancelled") {
      query.status = "cancelled";
    }

    const registrations = await Registration.find(query)
      .populate("event")
      .sort({ createdAt: -1 });

    // Further filter by event type or time
    let filteredRegistrations = registrations;

    if (filter === "upcoming") {
      filteredRegistrations = registrations.filter(
        reg => reg.event && new Date(reg.event.StartDate) >= new Date()
      );
    } else if (filter === "past") {
      filteredRegistrations = registrations.filter(
        reg => reg.event && new Date(reg.event.EndDate) < new Date()
      );
    } else if (filter === "completed") {
      filteredRegistrations = registrations.filter(
        reg => reg.event && reg.status === "registered" && new Date(reg.event.EndDate) < new Date()
      );
    } else if (filter === "normal") {
      filteredRegistrations = registrations.filter(
        reg => reg.event && reg.event.Type === "normal"
      );
    } else if (filter === "merchandise") {
      filteredRegistrations = registrations.filter(
        reg => reg.event && reg.event.Type === "merchandise"
      );
    }

    res.json(filteredRegistrations);

  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
