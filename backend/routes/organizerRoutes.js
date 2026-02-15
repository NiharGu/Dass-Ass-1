const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const organizerController = require("../controllers/organizerController");

// Public - Get all approved organizers
router.get("/", organizerController.getAllOrganizers);

// Public - Get organizer details with events
router.get("/:id", organizerController.getOrganizerById);

// Participant only - Follow organizer
router.post(
  "/:id/follow",
  authMiddleware,
  roleMiddleware(["participant"]),
  organizerController.followOrganizer
);

// Participant only - Unfollow organizer
router.delete(
  "/:id/unfollow",
  authMiddleware,
  roleMiddleware(["participant"]),
  organizerController.unfollowOrganizer
);

module.exports = router;
