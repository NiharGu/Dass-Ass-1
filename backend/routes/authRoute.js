const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Organizer requests password reset from admin (must be logged in)
router.post("/request-password-reset", authMiddleware, authController.requestPasswordReset);

module.exports = router;