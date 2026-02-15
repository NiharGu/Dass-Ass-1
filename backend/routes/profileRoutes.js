const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

// All profile routes require authentication
router.get("/", authMiddleware, profileController.getProfile);
router.patch("/", authMiddleware, profileController.updateProfile);
router.post("/change-password", authMiddleware, profileController.changePassword);

module.exports = router;
