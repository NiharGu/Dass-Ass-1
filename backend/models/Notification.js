const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    },
    link: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
