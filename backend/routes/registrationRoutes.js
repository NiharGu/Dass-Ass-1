const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  registerForEvent,
  cancelRegistration
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

module.exports = router;
