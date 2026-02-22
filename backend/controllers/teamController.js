const Team = require("../models/Team");
const Event = require("../models/events");
const Registration = require("../models/Registration");
const User = require("../models/User");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const createEmailTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        family: 4,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
    });
};

// Create a team for a team event
exports.createTeam = async (req, res) => {
    try {
        const { eventId, teamName } = req.body;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.status !== "published") return res.status(400).json({ message: "Event is not open" });

        if (!event.isTeamEvent) {
            return res.status(400).json({ message: "This event does not support team registration" });
        }

        // Check if user already has a team for this event
        const existing = await Team.findOne({
            event: eventId,
            $or: [{ leader: req.user.userId }, { members: req.user.userId }],
            status: { $ne: "cancelled" }
        });
        if (existing) return res.status(400).json({ message: "You already have a team for this event" });

        const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const team = await Team.create({
            name: teamName,
            event: eventId,
            leader: req.user.userId,
            maxSize: event.maxTeamSize,
            members: [req.user.userId],
            inviteCode
        });

        await team.populate("members", "firstName lastName email");
        await team.populate("event", "Name isTeamEvent minTeamSize maxTeamSize");

        res.status(201).json(team);
    } catch (error) {
        console.error("Create team error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Join a team via invite code
exports.joinTeam = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const team = await Team.findOne({ inviteCode, status: "forming" }).populate("event", "Name isTeamEvent minTeamSize maxTeamSize");
        if (!team) return res.status(404).json({ message: "Team not found or already registered" });

        // Check if user is already in a team for this event
        const existing = await Team.findOne({
            event: team.event._id,
            $or: [{ leader: req.user.userId }, { members: req.user.userId }],
            status: { $ne: "cancelled" }
        });
        if (existing) return res.status(400).json({ message: "You already have a team for this event" });

        if (team.members.length >= team.maxSize) {
            return res.status(400).json({ message: "Team is full" });
        }

        team.members.push(req.user.userId);
        await team.save();

        await team.populate("members", "firstName lastName email");

        res.json(team);
    } catch (error) {
        console.error("Join team error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Leader finalizes registration for the team
exports.registerTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate("event", "Name isTeamEvent minTeamSize maxTeamSize registrationLimit")
            .populate("members", "firstName lastName email");

        if (!team) return res.status(404).json({ message: "Team not found" });
        if (!team.leader.equals(req.user.userId)) {
            return res.status(403).json({ message: "Only the team leader can register the team" });
        }
        if (team.status === "complete") {
            return res.status(400).json({ message: "Team is already registered" });
        }
        if (team.status === "cancelled") {
            return res.status(400).json({ message: "Team has been cancelled" });
        }

        // Validate team size
        if (team.members.length < team.event.minTeamSize) {
            return res.status(400).json({
                message: `Team needs at least ${team.event.minTeamSize} members to register. Currently: ${team.members.length}`
            });
        }

        // Check registration limit
        const currentRegs = await Registration.countDocuments({
            event: team.event._id, status: "registered"
        });
        if (currentRegs + team.members.length > team.event.registrationLimit) {
            return res.status(400).json({ message: "Not enough registration slots available" });
        }

        // Mark team as complete
        team.status = "complete";
        await team.save();

        // Register all members
        const event = await Event.findById(team.event._id);
        for (const member of team.members) {
            const memberId = member._id || member;
            const user = await User.findById(memberId);
            const existingReg = await Registration.findOne({
                participant: memberId, event: event._id, status: "registered"
            });
            if (existingReg) continue;

            const ticketId = uuidv4();
            const qrData = {
                ticketId, eventId: event._id, eventName: event.Name,
                participantId: memberId, teamId: team._id, teamName: team.name
            };
            const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

            await Registration.create({
                participant: memberId, event: event._id, ticketId,
                formResponses: {}, merchandiseSelections: [], qrCode: qrCodeDataURL
            });

            // Send email
            try {
                const transporter = createEmailTransporter();
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: `Team Registration Complete - ${event.Name}`,
                    html: `
          <h2>Team Registration Complete!</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your team <strong>${team.name}</strong> has been registered for <strong>${event.Name}</strong>.</p>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <img src="${qrCodeDataURL}" alt="QR Code" style="width:200px;height:200px;"/>
          <p>Present this QR code at the venue.</p>
        `
                });
            } catch (e) {
                console.error("Team email failed:", e.message);
            }
        }

        await team.populate("members", "firstName lastName email");
        res.json({ message: "Team registered successfully!", team });
    } catch (error) {
        console.error("Register team error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get my teams
exports.getMyTeams = async (req, res) => {
    try {
        const teams = await Team.find({
            members: req.user.userId,
            status: { $ne: "cancelled" }
        })
            .populate("event", "Name StartDate EndDate isTeamEvent minTeamSize maxTeamSize")
            .populate("members", "firstName lastName email")
            .populate("leader", "firstName lastName email")
            .sort({ createdAt: -1 });

        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get team by id
exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate("event", "Name StartDate EndDate isTeamEvent minTeamSize maxTeamSize")
            .populate("members", "firstName lastName email")
            .populate("leader", "firstName lastName email");

        if (!team) return res.status(404).json({ message: "Team not found" });

        // Only team members can view
        if (!team.members.some(m => m._id.equals(req.user.userId))) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        res.json(team);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Leave team (non-leaders only, only while forming)
exports.leaveTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: "Team not found" });
        if (team.status !== "forming") return res.status(400).json({ message: "Cannot leave a registered team" });
        if (team.leader.equals(req.user.userId)) return res.status(400).json({ message: "Leader cannot leave. Cancel the team instead." });

        team.members = team.members.filter(m => !m.equals(req.user.userId));
        await team.save();

        res.json({ message: "Left team successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Cancel team (leader only, only while forming)
exports.cancelTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: "Team not found" });
        if (!team.leader.equals(req.user.userId)) return res.status(403).json({ message: "Only the leader can cancel" });
        if (team.status === "complete") return res.status(400).json({ message: "Cannot cancel a registered team" });

        team.status = "cancelled";
        await team.save();

        res.json({ message: "Team cancelled" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
