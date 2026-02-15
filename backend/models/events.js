const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    // ───── Required Event Attributes (Section 8) ─────

    Name: {
      type: String,
      required: true
    },

    Description: {
      type: String,
      required: true
    },

    Type: {
      type: String,
      enum: ["normal", "merchandise"],
      required: true
    },

    eligibility: {
      type: String, // "iiit-only", "non-iiit", "open"
      required: true
    },

    registrationDeadline: {
      type: Date,
      required: true
    },

    StartDate: {
      type: Date,
      required: true
    },

    EndDate: {
      type: Date,
      required: true
    },

    registrationLimit: {
      type: Number,
      required: true
    },

    registrationFee: {
      type: Number,
      required: true
    },

    Tags: [
      {
        type: String
      }
    ],

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ───── NORMAL EVENT ONLY ─────
    customForm: {
      type: Array,
      required: function () {
        return this.Type === "normal";
      }
    },

    // ───── MERCHANDISE EVENT ONLY ─────
    merchandiseDetails: {
      items: [
        {
          name: String,
          size: String,
          color: String,
          stock: Number,
          purchaseLimit: Number // Max quantity per participant for this specific item
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
