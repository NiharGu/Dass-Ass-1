const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const adminController = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

// Dashboard stats
router.get("/dashboard", adminController.getDashboardStats);

// Password reset request management (organizer only)
router.get("/password-reset-requests", adminController.getPasswordResetRequests);
router.post("/users/:userId/reset-password", adminController.resetUserPassword);
router.post("/users/:userId/reject-reset", adminController.rejectPasswordResetRequest);

// Organizer management
router.post("/organizers", adminController.createOrganizer);
router.get("/organizers", adminController.getAllOrganizers);
router.patch("/organizers/:id/enable", adminController.enableOrganizer);
router.patch("/organizers/:id/disable", adminController.disableOrganizer);
router.delete("/organizers/:id", adminController.deleteOrganizer);

module.exports = router;
