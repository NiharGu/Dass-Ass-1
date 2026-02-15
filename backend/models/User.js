const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        
        email:{
            type: String,
            required: true,
            unique: true
        },
        password:{
            type: String,
            required: true
        },
        role:{
            type: String,
            enum:["admin","organizer","participant"],
            required: true
        },

    // These are REQUIRED only if role === "participant"

    firstName: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    },

    lastName: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    },

    participantType: {
      type: String,
      enum: ["iiit", "non-iiit"],
      required: function () {
        return this.role === "participant";
      }
    },

    collegeOrOrgName: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    },

    contactNumber: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    },

    selectedInterests: {
      type: [String],
      enum: ["Sports", "Cultural", "Technical", "Music", "Dance", "Drama", "Art", "Literature", "Social", "Other"],
      default: []
    },

    followedClubs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },

    // These are REQUIRED only if role === "organizer"

    organizerName: {
      type: String,
      required: function () {
        return this.role === "organizer";
      }
    },

    category: {
      type: String,
      required: function () {
        return this.role === "organizer";
      }
    },

    description: {
      type: String,
      required: function () {
        return this.role === "organizer";
      }
    },

    contact: {
      type: String,
      required: function () {
        return this.role === "organizer";
      }
    },

    // Admin approval required for organizers
    isApproved: {
      type: Boolean,
      default: function () {
        return this.role !== "organizer"; // Auto-approve participants/admins, not organizers
      }
    },

    // Password reset fields
    resetPasswordToken: {
      type: String
    },

    resetPasswordExpires: {
      type: Date
    }
  }
 
);

module.exports = mongoose.model("User",userSchema);