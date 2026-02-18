const User = require("../models/User");
const bcrypt = require("bcrypt");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fields that can be updated based on role
    const allowedUpdates = {
      participant: ["firstName", "lastName", "contactNumber", "collegeOrOrgName", "selectedInterests", "followedClubs"],
      organizer: ["organizerName", "category", "description", "contact", "discordWebhookUrl"]
    };

    // Disabled organizers can view but not edit
    if (user.role === "organizer" && !user.isApproved) {
      return res.status(403).json({ message: "Your account is disabled. You cannot edit your profile." });
    }

    const updates = allowedUpdates[user.role] || [];

    // Validate contact for organizer
    if (user.role === "organizer" && req.body.contact !== undefined) {
      const contact = req.body.contact.trim();
      if (contact) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;
        if (!emailRegex.test(contact) && !phoneRegex.test(contact)) {
          return res.status(400).json({ message: "Contact must be a valid email or 10-digit phone number" });
        }
      }
      req.body.contact = contact;
    }

    // Check for duplicate organizer name
    if (user.role === "organizer" && req.body.organizerName !== undefined && req.body.organizerName !== user.organizerName) {
      const existing = await User.findOne({ organizerName: req.body.organizerName, role: "organizer", _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: "An organizer with this name already exists" });
      }
    }

    // Update only allowed fields
    updates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Return user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({ 
      message: "Profile updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
