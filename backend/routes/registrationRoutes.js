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


module.exports = router;
