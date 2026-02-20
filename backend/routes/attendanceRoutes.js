const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const attendanceController = require("../controllers/attendanceController");

router.post("/scan", authMiddleware, roleMiddleware(["organizer"]), attendanceController.scanAttendance);
router.post("/manual", authMiddleware, roleMiddleware(["organizer"]), attendanceController.manualAttendance);
router.get("/:eventId/dashboard", authMiddleware, roleMiddleware(["organizer"]), attendanceController.getAttendanceDashboard);
router.get("/:eventId/export", authMiddleware, roleMiddleware(["organizer"]), attendanceController.exportAttendanceCSV);

module.exports = router;
