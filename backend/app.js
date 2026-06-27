const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketConfig = require("./config/socket");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

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
    } catch (_err) {
        // Not a URL, ignore
    }

    return undefined;
};

const isProduction = process.env.NODE_ENV === "production";
const PORT = parsePortValue(process.env.PORT);

if (isProduction && PORT == null) {
    console.error("Production requires a valid numeric PORT environment variable from the cloud provider.");
    process.exit(1);
}

const listenPort = PORT ?? 8000;
const app = express();
const server = http.createServer(app);

// Initialize Sockets
socketConfig(server);

// Normalize Origins to prevent trailing slash mismatches
const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const corsOriginEnv = String(process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "");
const allowedOrigins = [
    ...new Set([
        ...corsOriginEnv
            .split(",")
            .map(normalizeOrigin)
            .filter(Boolean),
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://real-time-chat-applicaion.vercel.app",
    ].filter(Boolean)),
];

const isAllowedOrigin = (requestOrigin) => {
    if (!requestOrigin) return true;

    const normalized = normalizeOrigin(requestOrigin);
    if (allowedOrigins.includes(normalized)) return true;

    return /^(https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?|https:\/\/(?:[a-z0-9-]+\.)*vercel\.app)$/i.test(normalized);
};

const corsOptions = {
    origin: (requestOrigin, callback) => {
        if (isAllowedOrigin(requestOrigin)) {
            return callback(null, true);
        }

        const corsError = new Error(`CORS blocked for origin: ${requestOrigin}`);
        corsError.statusCode = 403;
        return callback(corsError);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

// CORS Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

// Global JSON error handler
app.use((err, req, res, next) => {
    console.error("Error Caught in Middleware:", err.message);

    if (res.headersSent) return next(err);

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Server error";

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid id";
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation error";
    } else if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 400;
        message = "File too large";
    }

    res.status(statusCode).json({
        success: false,
        message
    });
});

const handleServerError = (error) => {
    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof listenPort === "string" ? `Pipe ${listenPort}` : `Port ${listenPort}`;

    if (error.code === "EADDRINUSE") {
        console.error(`${bind} is already in use. Please stop the process using it or change the PORT environment variable.`);
        process.exit(1);
    }

    console.error("Server error:", error);
    process.exit(1);
};

const startServer = async () => {
    await connectDB();
    
    server.on("error", handleServerError);
    server.listen(listenPort, () => {
        console.log(`Server is listening on port ${listenPort}`);
    });
};

startServer();