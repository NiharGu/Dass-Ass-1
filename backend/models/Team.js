const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        leader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        maxSize: { type: Number, required: true, min: 2 },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        inviteCode: { type: String, unique: true, required: true },
        memberFormResponses: {
            type: Map,
            of: Object,
            default: {}
        },
        status: {
            type: String,
            enum: ["forming", "complete", "cancelled"],
            default: "forming"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
