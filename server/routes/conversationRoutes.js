const express = require("express");
const {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
} = require("../controllers/conversationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getConversations);
router.post("/", authMiddleware, startConversation);
router.get("/:id/messages", authMiddleware, getMessages);
router.post("/:id/messages", authMiddleware, sendMessage);

module.exports = router;
