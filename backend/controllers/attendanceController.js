const Registration = require("../models/Registration");
const Event = require("../models/events");

// Scan QR code and mark attendance
exports.scanAttendance = async (req, res) => {
    try {
        const { ticketId, eventId } = req.body;

        if (!ticketId || !eventId) {
            return res.status(400).json({ message: "ticketId and eventId are required" });
        }

        // Verify event belongs to this organizer
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!event.organizer.equals(req.user.userId)) {
            return res.status(403).json({ message: "Not your event" });
        }

        // Find the registration
        const registration = await Registration.findOne({
            ticketId,
            event: eventId,
            status: "registered"
        }).populate("participant", "firstName lastName email");

        if (!registration) {
            return res.status(404).json({ message: "Invalid ticket. No matching registration found." });
        }

        // Check for duplicate scan
        if (registration.attended) {
            return res.status(409).json({
                message: "Already scanned! This ticket was scanned at " +
                    new Date(registration.attendedAt).toLocaleString()
            });
        }

        // Mark attendance on registration
        registration.attended = true;
        registration.attendedAt = new Date();
        registration.attendedBy = req.user.userId;
        registration.attendanceMethod = "qr";
        await registration.save();

        res.status(201).json({
            message: "Attendance marked successfully",
            participant: {
                name: `${registration.participant.firstName} ${registration.participant.lastName}`,
                email: registration.participant.email,
                ticketId
            }
        });
    } catch (error) {
        console.error("Scan attendance error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Manual attendance override
exports.manualAttendance = async (req, res) => {
    try {
        const { registrationId, eventId } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!event.organizer.equals(req.user.userId)) {
            return res.status(403).json({ message: "Not your event" });
        }

        const registration = await Registration.findOne({
            _id: registrationId,
            event: eventId,
            status: "registered"
        });

        if (!registration) {
            return res.status(404).json({ message: "Registration not found" });
        }

        if (registration.attended) {
            return res.status(409).json({ message: "Already marked as attended" });
        }

        registration.attended = true;
        registration.attendedAt = new Date();
        registration.attendedBy = req.user.userId;
        registration.attendanceMethod = "manual";
        await registration.save();

        res.status(201).json({ message: "Manual attendance marked" });
    } catch (error) {
        console.error("Manual attendance error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get attendance dashboard for an event
exports.getAttendanceDashboard = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!event.organizer.equals(req.user.userId)) {
            return res.status(403).json({ message: "Not your event" });
        }

        const allRegistrations = await Registration.find({
            event: eventId, status: "registered"
        }).populate("participant", "firstName lastName email").sort({ createdAt: -1 });

        const attended = allRegistrations.filter(r => r.attended);
        const notAttended = allRegistrations.filter(r => !r.attended);

        res.json({
            eventName: event.Name,
            total: allRegistrations.length,
            scanned: attended.length,
            notScanned: notAttended.length,
            attendances: attended.map(r => ({
                participantName: `${r.participant.firstName} ${r.participant.lastName}`,
                email: r.participant.email,
                ticketId: r.ticketId,
                scannedAt: r.attendedAt,
                method: r.attendanceMethod
            })),
            notScannedList: notAttended.map(r => ({
                registrationId: r._id,
                participantName: r.participant ? `${r.participant.firstName} ${r.participant.lastName}` : "Unknown",
                email: r.participant?.email || "N/A",
                ticketId: r.ticketId
            }))
        });
    } catch (error) {
        console.error("Attendance dashboard error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Export attendance as CSV
exports.exportAttendanceCSV = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!event.organizer.equals(req.user.userId)) {
            return res.status(403).json({ message: "Not your event" });
        }

        const attended = await Registration.find({
            event: eventId, status: "registered", attended: true
        }).populate("participant", "firstName lastName email").sort({ attendedAt: 1 });

        const headers = ["Name", "Email", "Ticket ID", "Scanned At", "Method"];
        const rows = attended.map(r => [
            `"${r.participant.firstName} ${r.participant.lastName}"`,
            r.participant.email,
            r.ticketId,
            new Date(r.attendedAt).toISOString(),
            r.attendanceMethod
        ].join(","));

        const csv = [headers.join(","), ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${event.Name}-attendance.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
