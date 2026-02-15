const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createEvent,
  getAllEvents,
  getEventById,
  getOrganizerEvents,
  getTrendingEvents
} = require("../controllers/eventController");

router.get("/", getAllEvents);
router.get("/trending", getTrendingEvents);

router.get(
  "/organizer",
  authMiddleware,
  roleMiddleware(["organizer"]),
  getOrganizerEvents
);

router.get("/:id", getEventById);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["organizer"]),
  createEvent
);

module.exports = router;
