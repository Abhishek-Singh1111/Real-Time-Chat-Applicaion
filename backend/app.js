const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Socket store (singleton module - same object everywhere)
const socketStore = require("./config/socketStore");

// Render/Node expects PORT to be a number
const parsePortValue = (value) => {
    if (!value) return undefined;

    const parsedNumber = Number.parseInt(String(value), 10);
    if (Number.isFinite(parsedNumber)) return parsedNumber;

    try {
        const url = new URL(String(value));
        if (url.port) {
            const parsedUrlPort = Number.parseInt(url.port, 10);
            if (Number.isFinite(parsedUrlPort)) return parsedUrlPort;
        }
    } catch (_err) {}

    return undefined;
};

const isProduction = process.env.NODE_ENV === "production";
const PORT = parsePortValue(process.env.PORT);

if (isProduction && PORT == null) {
    console.error("Production requires a valid numeric PORT.");
    process.exit(1);
}

const listenPort = PORT ?? 8000;

const app = express();
const server = http.createServer(app);

// Normalize Origins
const normalizeOrigin = (value) =>
    String(value || "").trim().replace(/\/+$/, "");

const corsOriginEnv = String(
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
);

const allowedOrigins = [
    ...new Set(
        corsOriginEnv
            .split(",")
            .map(normalizeOrigin)
            .filter(Boolean)
    ),
];

const isAllowedOrigin = (requestOrigin) => {
    if (!requestOrigin) return true;

    return allowedOrigins.includes(normalizeOrigin(requestOrigin));
};

// Express CORS
const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

// Register IO instance in central store (same object used everywhere)
socketStore.setIO(io);

// Socket Events
io.on("connection", (socket) => {

    console.log("Socket Connected:", socket.id);

    socket.on("join", (userId) => {

        console.log("JOIN EVENT RECEIVED:", userId);

        socketStore.addOnlineUser(userId, socket.id);

        console.log("Online Users:", socketStore.getOnlineUsers());

        // Broadcast to all clients that this user is online
        io.emit("user_online", userId);

    });

    socket.on("disconnect", () => {

        const disconnectedUserId = socketStore.removeOnlineUserBySocketId(socket.id);

        console.log("Socket Disconnected:", socket.id);

        // Broadcast to all clients that this user is offline
        if (disconnectedUserId) {
            io.emit("user_offline", disconnectedUserId);
        }

    });

});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

// Error Handler
app.use((err, req, res, next) => {

    console.error(err);

    if (res.headersSent) return next(err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Server Error";

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID";
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation Error";
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 400;
        message = "File Too Large";
    }

    res.status(statusCode).json({
        success: false,
        message
    });

});

const handleServerError = (error) => {

    if (error.syscall !== "listen") throw error;

    if (error.code === "EADDRINUSE") {

        console.error(`Port ${listenPort} is already in use.`);
        process.exit(1);

    }

    console.error(error);
    process.exit(1);

};

const startServer = async () => {

    await connectDB();

    server.on("error", handleServerError);

    server.listen(listenPort, () => {

        console.log(`Server running on port ${listenPort}`);

    });

};

startServer();