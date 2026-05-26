const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer TOKEN"
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        
        next();
        
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired"
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
};

module.exports = authMiddleware;