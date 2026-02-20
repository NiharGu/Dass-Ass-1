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
    },

    // Request tracking
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    // Admin comment when approving or rejecting
    adminComment: {
      type: String,
      default: ""
    },

    // When the admin acted on this request
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Auto-delete expired *email* requests only
passwordResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
