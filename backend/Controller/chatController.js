const Chat = require("../model/chatSchema");
const User = require("../model/userSchema");
const mongoose = require("mongoose");
const { handleUpload } = require('../utils/cloudinary');
const socketStore = require("../config/socketStore");

// Allowed file types and size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; 
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];


exports.sendMessage = async (req, res, next) => {
    console.log("sendMessage called");

    try {
        const sender = req.user.userId;
        const receiver = req.body?.receiver ?? req.body?.receiverId;
        const message = req.body?.message?.trim();

        // Validation
        if (!receiver) {
            return res.status(400).json({
                success: false,
                message: "Receiver is required"
            });
        }

        if (!mongoose.isValidObjectId(receiver)) {
            return res.status(400).json({
                success: false,
                message: "Receiver must be a valid user id"
            });
        }

        if (!message && !req.file) {
            return res.status(400).json({
                success: false,
                message: "Message or image is required"
            });
        }

        // Check sender
        const senderUser = await User.findById(sender).select("_id");
        if (!senderUser) {
            return res.status(401).json({
                success: false,
                message: "Invalid sender"
            });
        }

        // Check receiver
        const receiverUser = await User.findById(receiver).select("_id");
        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        // Upload image if exists
        let image_url = null;

        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            const cldRes = await handleUpload(dataURI);

            image_url = cldRes.secure_url || cldRes.url;
        }

        // Save chat
        const newChat = await Chat.create({
            sender,
            receiver,
            message: message || null,
            image_url
        });

        // Save chat id in users
        await User.findByIdAndUpdate(sender, {
            $push: { chats: newChat._id }
        });

        await User.findByIdAndUpdate(receiver, {
            $push: { chats: newChat._id }
        });

        // Populate sender & receiver
        const populatedChat = await Chat.findById(newChat._id)
            .populate("sender", "username profile_img")
            .populate("receiver", "username profile_img");

        // Socket - use central store (same object as socket handlers)
        const io = socketStore.getIO();
        const onlineUsers = socketStore.getOnlineUsers();

        console.log("=================================");
        console.log("Sender:", sender);
        console.log("Receiver:", receiver);
        console.log("Online Users:", onlineUsers);

        const receiverSocketId = onlineUsers[receiver];

        console.log("Receiver Socket ID:", receiverSocketId);

        if (receiverSocketId) {
            console.log("Sending receive_message event...");
            io.to(receiverSocketId).emit("receive_message", populatedChat);
            console.log("receive_message emitted successfully");
        } else {
            console.log("Receiver is OFFLINE");
        }

        console.log("=================================");

        res.status(201).json({
            success: true,
            chat: populatedChat
        });

    } catch (error) {
        console.error("Send Message Error:", error);
        next(error);
    }
};
// Get chat history between two users
exports.getChatHistory = async (req, res, next) => {
    try {
        const sender = req.user.userId;
        const { receiverId } = req.params;

        // Validate receiverId
        if (!mongoose.isValidObjectId(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiver ID"
            });
        }

        // Find all chats between sender and receiver
        const chats = await Chat.find({
            $or: [
                { sender: sender, receiver: receiverId },
                { sender: receiverId, receiver: sender }
            ]
        })
        .sort({ createdAt: 1 }) // Sort by oldest first
        .populate("sender", "username email profile_img profilePicture") 
        .populate("receiver", "username email profile_img profilePicture"); 
     
    const onlineUsers = socketStore.getOnlineUsers();
    const receiverSocketId = onlineUsers[receiverId];

    console.log("Receiver Socket:", receiverSocketId);
        res.status(200).json({
            success: true,
            chats: chats
        });

    } catch (error) {
        console.error("Get Chat History Error:", error);
        next(error);
    }
};

// Get all chats for a user (all conversations)
exports.getUserChats = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const chats = await Chat.find({
            $or: [{ sender: userId }, { receiver: userId }],
        })
        .sort({ updatedAt: -1 })
        .populate("sender", "username email profile_img profilePicture") 
        .populate("receiver", "username email profile_img profilePicture"); 

        const conversationsByUser = new Map();

        for (const chat of chats) {
            const senderId = chat.sender?._id ? String(chat.sender._id) : null;
            const otherUser = senderId === String(userId) ? chat.receiver : chat.sender;

            if (!otherUser?._id) continue;

            const key = String(otherUser._id);
            if (conversationsByUser.has(key)) continue;

            conversationsByUser.set(key, {
                user: otherUser,
                lastMessage: chat.message,
                lastMessageTime: chat.updatedAt || chat.createdAt,
                image_url: chat.image_url // Include image if last message was an image
            });
        }

        res.status(200).json({
            success: true,
            conversations: Array.from(conversationsByUser.values()),
        });

    } catch (error) {
        console.error("Get User Chats Error:", error);
        next(error);
    }
};

// Get all users the current user has chatted with
exports.getConversations = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Find all chats of logged-in user
        const chats = await Chat.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        })
        .populate("sender", "username email profile_img profilePicture") // ✅ Fixed: use "username"
        .populate("receiver", "username email profile_img profilePicture") // ✅ Fixed: use "username"
        .sort({ createdAt: -1 });

        const conversationsMap = new Map();

        chats.forEach((chat) => {
            // Find the other user
            const otherUser = chat.sender._id.toString() === userId 
                ? chat.receiver 
                : chat.sender;

            const otherUserId = otherUser._id.toString();

            // Only add latest message once
            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, {
                    user: otherUser,
                    lastMessage: chat.message,
                    lastMessageTime: chat.createdAt,
                    image_url: chat.image_url // Include image if last message was an image
                });
            }
        });

        res.status(200).json({
            success: true,
            conversations: Array.from(conversationsMap.values())
        });

    } catch (error) {
        console.error("Get Conversations Error:", error);
        next(error);
    }
};