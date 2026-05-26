const express = require("express");
const router = express.Router();
const chatController = require("../Controller/chatController");
const authMiddleware = require("../middlewares/auth");

// All chat routes require authentication
router.post("/send", authMiddleware, chatController.sendMessage);
router.get("/history/:receiverId", authMiddleware, chatController.getChatHistory);
router.get("/conversations", authMiddleware, chatController.getUserChats);
router.get("/chat-users", authMiddleware, chatController.getConversations);

module.exports = router;
