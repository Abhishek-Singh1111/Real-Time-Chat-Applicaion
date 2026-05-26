const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/chatDB");
        console.log("MongoDB Connected...");
    } catch (err) {
        console.log("Database Connection Error:", err);
        process.exit(1);
    }
};

module.exports = connectDB;
