const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createEvent,
  getAllEvents,
  getEventById,
  getOrganizerEvents,
  getTrendingEvents,
  publishEvent,
  updateEvent,
  closeEvent,
  getOrganizerDashboard,
  getEventParticipants,
  exportEventParticipantsCSV
} = require("../controllers/eventController");

router.get("/", getAllEvents);
router.get("/trending", getTrendingEvents);

router.get(
  "/organizer",
  authMiddleware,
  roleMiddleware(["organizer"]),
  getOrganizerEvents
);

// Organizer dashboard analytics (Section 10.2)
router.get(
  "/organizer/dashboard",
  authMiddleware,
  roleMiddleware(["organizer"]),
  getOrganizerDashboard
);

// Event participants list (Section 10.3) - organizer only
router.get(
  "/:id/participants",
  authMiddleware,
  roleMiddleware(["organizer"]),
  getEventParticipants
);

// Export participants as CSV (Section 10.3) - organizer only
router.get(
  "/:id/participants/export",
  authMiddleware,
  roleMiddleware(["organizer"]),
  exportEventParticipantsCSV
);

router.get("/:id", getEventById);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["organizer"]),
  createEvent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["organizer"]),
  updateEvent
);

router.patch(
  "/:id/publish",
  authMiddleware,
  roleMiddleware(["organizer"]),
  publishEvent
);

router.patch(
  "/:id/close",
  authMiddleware,
  roleMiddleware(["organizer"]),
  closeEvent
);

module.exports = router;
