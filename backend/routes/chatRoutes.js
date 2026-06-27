const express = require("express");
const router = express.Router();
const chatController = require("../Controller/chatController");
const authMiddleware = require("../middlewares/auth");
const { upload, handleMulterError } = require('../middlewares/upload');

// All chat routes require authentication
router.post("/send", authMiddleware, upload.single("my_file"), handleMulterError, chatController.sendMessage);
router.get("/history/:receiverId", authMiddleware, chatController.getChatHistory);
router.get("/conversations", authMiddleware, chatController.getConversations); // ✅ Use this one

module.exports = router;