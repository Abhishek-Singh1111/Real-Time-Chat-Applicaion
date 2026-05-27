const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = async () => {
	    try {
	        if (!process.env.MONGO_URI) {
	            throw new Error("Missing MONGO_URI in backend/.env");
	        }
	        await mongoose.connect(process.env.MONGO_URI);
	        console.log("MongoDB Connected...");
	    } catch (err) {
	        console.log("Database Connection Error:", err);
	        process.exit(1);
	    }
};

module.exports = connectDB;
