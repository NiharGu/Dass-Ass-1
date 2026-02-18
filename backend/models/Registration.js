const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    ticketId: {
      type: String,
      unique: true,
      required: true
    },

    formResponses: {
      type: Object, // answers to custom form
      default: {}
    },

    merchandiseSelections: [
      {
        itemName: String,
        size: String,
        color: String,
        quantity: {
          type: Number,
          default: 1
        }
      }
    ],

    qrCode: {
      type: String
    },

    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
