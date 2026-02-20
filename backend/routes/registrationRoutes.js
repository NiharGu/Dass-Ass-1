const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  registerForEvent,
  cancelRegistration,
  getParticipantRegistrations
} = require("../controllers/registrationController");

router.post(
  "/:id/register",
  authMiddleware,
  roleMiddleware(["participant"]),
  registerForEvent
);

router.patch(
  "/registration/:registrationId/cancel",
  authMiddleware,
  roleMiddleware(["participant"]),
  cancelRegistration
);

router.get(
  "/my-registrations",
  authMiddleware,
  roleMiddleware(["participant"]),
  getParticipantRegistrations
);

// Add to Calendar - Generate .ics file
router.get(
  "/:registrationId/calendar",
  authMiddleware,
  roleMiddleware(["participant"]),
  async (req, res) => {
    try {
      const Registration = require("../models/Registration");
      const registration = await Registration.findOne({
        _id: req.params.registrationId,
        participant: req.user.userId,
        status: "registered"
      }).populate("event");

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      const event = registration.event;
      const formatDate = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Felicity//Event//EN",
        "BEGIN:VEVENT",
        `DTSTART:${formatDate(event.StartDate)}`,
        `DTEND:${formatDate(event.EndDate)}`,
        `SUMMARY:${event.Name}`,
        `DESCRIPTION:${event.Description.replace(/\n/g, "\\n").substring(0, 200)}`,
        `UID:${registration.ticketId}@felicity`,
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${event.Name}.ics"`);
      res.send(ics);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
