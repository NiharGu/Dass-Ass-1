const mongoose = require("mongoose");

const passwordResetRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    token: {
      type: String,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    // Only used for organizer requests to admin
    reason: {
      type: String
    },

    // Organizer's desired new password (hashed)
    newPasswordHash: {
      type: String
    },

    // "email" = participant self-reset via email link
    // "admin" = organizer requesting admin to reset
    type: {
      type: String,
      enum: ["email", "admin"],
      required: true
    }
  },
  { timestamps: true }
);

// Auto-delete expired requests
passwordResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
