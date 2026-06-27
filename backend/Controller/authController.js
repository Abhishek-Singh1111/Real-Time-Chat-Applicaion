const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");
const bcrypt = require("bcryptjs");

const toUsernameBase = (value) => {
    if (!value) return "user";
    return String(value)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9_]/g, "");
};

const generateUniqueUsername = async ({ name, email }) => {
    const emailBase = toUsernameBase(String(email || "").split("@")[0]);
    const nameBase = toUsernameBase(name);
    const base = emailBase || nameBase || "user";

    let candidate = base;
    for (let attempt = 0; attempt < 8; attempt++) {
        const existing = await User.findOne({ username: candidate }).select("_id");
        if (!existing) return candidate;
        candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    return `${base}${Date.now().toString().slice(-6)}`;
};

exports.signup = async (req, res, next) => {
    try {
        const source = Object.keys(req.body || {}).length ? req.body : req.query;
        const name = source.name || source.username || "";
        const email = source.email;
        const password = source.password;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required for signup"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(String(password), 10);
        
        const username = await generateUniqueUsername({ name, email });

        // Create user
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword
        });
        
        // Save user
        await newUser.save();
        
        // Generate token
        const token = jwt.sign(
            {
                userId: newUser._id,
                email: newUser.email
            },
            process.env.JWT_SECRET || "secretkeyappearshere",
            {
                expiresIn: "1d"
            }
        );
        
        // Send response
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                userId: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                token
            }
        });
        
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            success: false,
            message: "Error! Something went wrong."
        });
    }
    
};

exports.login = async (req, res, next) => {

    try {
        const source = Object.keys(req.body || {}).length ? req.body : req.query;
        const email = source.email;
        const password = source.password;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required for login"
            });
        }

        // Find user
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(
            String(password),
            existingUser.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate token
        const token = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email
            },
            process.env.JWT_SECRET || "secretkeyappearshere",
            {
                expiresIn: "1h"
            }
        );

        // Response
        res.status(200).json({
            success: true,
            data: {
                userId: existingUser.id,
                email: existingUser.email,
                token
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Error! Something went wrong."
        });
    }

};
