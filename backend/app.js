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

// Render/Node expects PORT to be a number. If `.env` accidentally sets PORT to a URL,
// `server.listen()` will throw (EACCES / invalid address). Coerce to a numeric port.
const parsedPort = Number.parseInt(String(process.env.PORT ?? ""), 10);
const PORT = Number.isFinite(parsedPort) ? parsedPort : 8000;
const app = express();

const server = http.createServer(app);

socketConfig(server);


// CORS Middleware - Fixed
app.use(cors({
    origin: process.env.origin,  
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

// JSON error handler (keeps frontend fetch().json() working)
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
    }

    res.status(statusCode).json({
        success: false,
        message
    });
});
const startServer = async () => {
    await connectDB();
    
    server.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
        console.log(`Signup endpoint: http://localhost:${PORT}/api/auth/signup`);
        console.log(`Login endpoint: http://localhost:${PORT}/api/auth/login`);
    });
};

startServer();
