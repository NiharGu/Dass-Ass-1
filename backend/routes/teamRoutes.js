const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const teamController = require("../controllers/teamController");

router.post("/", authMiddleware, roleMiddleware(["participant"]), teamController.createTeam);
router.post("/join", authMiddleware, roleMiddleware(["participant"]), teamController.joinTeam);
router.get("/my-teams", authMiddleware, roleMiddleware(["participant"]), teamController.getMyTeams);
router.get("/:id", authMiddleware, teamController.getTeamById);
router.patch("/:id/leave", authMiddleware, roleMiddleware(["participant"]), teamController.leaveTeam);
router.patch("/:id/cancel", authMiddleware, roleMiddleware(["participant"]), teamController.cancelTeam);

module.exports = router;
