const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const forumController = require("../controllers/forumController");

router.get("/:eventId/messages", authMiddleware, forumController.getMessages);
router.post("/:eventId/messages", authMiddleware, forumController.postMessage);
router.delete("/:eventId/messages/:messageId", authMiddleware, forumController.deleteMessage);
router.patch("/:eventId/messages/:messageId/pin", authMiddleware, forumController.togglePin);
router.post("/:eventId/messages/:messageId/react", authMiddleware, forumController.reactToMessage);

module.exports = router;
