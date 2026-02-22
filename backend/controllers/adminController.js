const User = require("../models/User");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Generate random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString("hex");
};

// Create new organizer account
exports.createOrganizer = async (req, res) => {
  try {
    const { organizerName, category, description, contact } = req.body;

    // Validate required fields
    if (!organizerName || !category || !description || !contact) {
      return res.status(400).json({
        message: "All fields are required: organizerName, category, description, contact"
      });
    }

    // Validate contact is email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    if (!emailRegex.test(contact) && !phoneRegex.test(contact)) {
      return res.status(400).json({ message: "Contact must be a valid email or 10-digit phone number" });
    }

    // Check for duplicate organizer name
    const existingOrganizer = await User.findOne({ organizerName, role: "organizer" });
    if (existingOrganizer) {
      return res.status(400).json({ message: "An organizer with this name already exists" });
    }

    // Auto-generate email from organizer name
    const emailBase = organizerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special chars
      .substring(0, 20); // Limit length

    let email = `${emailBase}@events.com`;
    let counter = 1;

    // Ensure unique email
    while (await User.findOne({ email })) {
      email = `${emailBase}${counter}@events.com`;
      counter++;
    }

    // Generate random password
    const password = generatePassword();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organizer account
    const organizer = await User.create({
      email,
      password: hashedPassword,
      role: "organizer",
      organizerName,
      category,
      description,
      contact,
      isApproved: true // Auto-approve admin-created accounts
    });

    res.status(201).json({
      message: "Organizer account created successfully. Share these credentials with the organizer.",
      organizer: {
        id: organizer._id,
        email: organizer.email,
        organizerName: organizer.organizerName,
        category: organizer.category,
        isApproved: organizer.isApproved
      },
      credentials: {
        email,
        password
      }
    });
  } catch (error) {
    console.error("Create organizer error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all organizers (enabled, disabled, or all)
exports.getAllOrganizers = async (req, res) => {
  try {
    const { status } = req.query; // "enabled", "disabled", or all

    let query = { role: "organizer" };

    if (status === "enabled") {
      query.isApproved = true;
    } else if (status === "disabled") {
      query.isApproved = false;
    }

    const organizers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(organizers);
  } catch (error) {
    console.error("Get organizers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Enable organizer (allow login and event creation)
exports.enableOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (organizer.isApproved) {
      return res.status(400).json({ message: "Organizer is already enabled" });
    }

    organizer.isApproved = true;
    await organizer.save();

    res.json({
      message: "Organizer enabled successfully. They can now log in and create events.",
      organizer: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        isApproved: organizer.isApproved
      }
    });
  } catch (error) {
    console.error("Enable organizer error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Disable organizer (they cannot log in, but data is preserved)
exports.disableOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (!organizer.isApproved) {
      return res.status(400).json({ message: "Organizer is already disabled" });
    }

    organizer.isApproved = false;
    await organizer.save();

    res.json({
      message: "Organizer disabled successfully. They can no longer log in or create events.",
      organizer: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        isApproved: organizer.isApproved
      }
    });
  } catch (error) {
    console.error("Disable organizer error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Permanently delete organizer
exports.deleteOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Check if organizer has events
    const Event = require("../models/events");
    const eventCount = await Event.countDocuments({ organizer: req.params.id });

    // Delete the organizer
    // Note: Events are preserved for historical records and participant access
    // Frontend should handle deleted organizer gracefully (e.g., show "[Deleted Organizer]")
    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "Organizer permanently deleted",
      deletedId: req.params.id,
      note: eventCount > 0 ? `${eventCount} events preserved for participant records` : "No events to preserve"
    });
  } catch (error) {
    console.error("Delete organizer error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const Event = require("../models/events");

    const totalOrganizers = await User.countDocuments({ role: "organizer" });
    const enabledOrganizers = await User.countDocuments({
      role: "organizer",
      isApproved: true
    });
    const disabledOrganizers = await User.countDocuments({
      role: "organizer",
      isApproved: false
    });
    const totalParticipants = await User.countDocuments({ role: "participant" });
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({
      StartDate: { $gte: new Date() }
    });

    res.json({
      totalOrganizers,
      enabledOrganizers,
      disabledOrganizers,
      totalParticipants,
      totalEvents,
      upcomingEvents
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get organizer password reset requests
exports.getPasswordResetRequests = async (req, res) => {
  try {
    const { status } = req.query; // "pending", "approved", "rejected", or all
    let query = { type: "admin" };
    if (status) {
      query.status = status;
    }

    const requests = await PasswordResetRequest.find(query)
      .populate("user", "-password")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Get password reset requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve organizer password reset - use organizer's chosen password
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { comment } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "organizer") {
      return res.status(400).json({ message: "Only organizer password resets are handled by admin" });
    }

    // Find the pending reset request with the stored password hash
    const resetRequest = await PasswordResetRequest.findOne({ user: user._id, type: "admin", status: "pending" });

    if (!resetRequest || !resetRequest.newPasswordHash) {
      return res.status(400).json({ message: "No pending password reset request found for this organizer" });
    }

    // Use the organizer's chosen password (already hashed)
    user.password = resetRequest.newPasswordHash;
    await user.save();

    // Update request status instead of deleting (keep for history)
    resetRequest.status = "approved";
    resetRequest.adminComment = comment || "";
    resetRequest.resolvedAt = new Date();
    await resetRequest.save();

    res.json({
      message: "Password reset approved. The organizer can now log in with their new password."
    });
  } catch (error) {
    console.error("Reset user password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject organizer password reset request
exports.rejectPasswordResetRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { comment } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetRequest = await PasswordResetRequest.findOne({ user: user._id, type: "admin", status: "pending" });
    if (!resetRequest) {
      return res.status(400).json({ message: "No pending request found" });
    }

    // Update status instead of deleting
    resetRequest.status = "rejected";
    resetRequest.adminComment = comment || "";
    resetRequest.resolvedAt = new Date();
    await resetRequest.save();

    res.json({ message: "Password reset request rejected" });
  } catch (error) {
    console.error("Reject password reset error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
