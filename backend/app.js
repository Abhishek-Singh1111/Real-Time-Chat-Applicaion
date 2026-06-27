const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const http = require("http");
const socketConfig = require("./config/socket");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const cors = require("cors");

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

socketConfig(server);

const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const corsOriginEnv = String(process.env.CORS_ORIGIN || "");
const allowedOrigins = [
    ...corsOriginEnv
        .split(",")
        .map(normalizeOrigin)
        .filter(Boolean),
    "http://localhost:5173",
    "http://localhost:3000",
].filter(Boolean);

// CORS Middleware
app.use(
    cors({
        origin: (requestOrigin, callback) => {
            if (!requestOrigin) return callback(null, true);
            const normalized = normalizeOrigin(requestOrigin);
            if (allowedOrigins.includes(normalized)) return callback(null, true);
            return callback(new Error(`CORS blocked for origin: ${requestOrigin}`));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

// JSON error handler
app.use((err, req, res, next) => {
    console.error(err);

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
        console.log(`Signup endpoint: http://localhost:${listenPort}/api/auth/signup`);
        console.log(`Login endpoint: http://localhost:${listenPort}/api/auth/login`);
    });
};

startServer();