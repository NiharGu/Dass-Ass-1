const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
        isPinned: { type: Boolean, default: false },
        isAnnouncement: { type: Boolean, default: false },
        reactions: {
            type: Map,
            of: [mongoose.Schema.Types.ObjectId], // emoji -> [userIds]
            default: {}
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
