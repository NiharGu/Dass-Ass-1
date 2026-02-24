const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

// Get all notifications
router.get("/", authMiddleware, notificationController.getNotifications);

// Mark specific notification as read
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

// Mark all as read
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

module.exports = router;
