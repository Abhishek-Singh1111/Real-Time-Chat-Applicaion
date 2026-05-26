require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes =  require("./routes/chatRoutes")
const cors = require("cors");
const app = express();

// CORS Middleware - Fixed
app.use(cors({
    origin: "http://localhost:5173",  // No trailing slash
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
    
    app.listen(8000, () => {
        console.log("✅ Server is listening on port 8000");
        console.log("📍 Signup endpoint: http://localhost:8000/api/auth/signup");
        console.log("📍 Login endpoint: http://localhost:8000/api/auth/login");
    });
};

startServer();
