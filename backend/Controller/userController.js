const User = require("../model/userSchema");
// Search user by username or email
exports.searchUser = async (req, res, next) => {
    try {
        const { query } = req.query; // Get search query from query params
        
        if (!query || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Please provide a search query (username or email)"
            });
        }
        
        // Create search condition - search by username OR email
        const searchCondition = {
            $or: [
                { username: { $regex: query, $options: 'i' } }, // Case-insensitive username search
                { name: { $regex: query, $options: 'i' } }, // Fallback: name search
                { email: { $regex: query, $options: 'i' } }      // Case-insensitive email search
            ]
        };
        
        // Find users matching the condition
        const users = await User.find(searchCondition).select("-password"); // Exclude password field
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No user found with the provided username or email",
                data: []
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Users found successfully",
            count: users.length,
            data: users
        });
        
    } catch (error) {
        console.error("Search user error:", error);
        return res.status(500).json({
            success: false,
            message: "Error searching for users",
            error: error.message
        });
    }
};

// Get user by exact username or email (for single user)
exports.getUserByUsernameOrEmail = async (req, res, next) => {
    try {
        const { username, email } = req.query;
        
        if (!username && !email) {
            return res.status(400).json({
                success: false,
                message: "Please provide either username or email"
            });
        }
        
        // Build search object
        let searchObject = {};
        if (username) searchObject.username = username;
        if (email) searchObject.email = email;
        
        const user = await User.findOne(searchObject).select("-password");
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
        
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            success: false,
            message: "Error finding user",
            error: error.message
        });
    }
};

// Advanced search with filters
exports.advancedSearch = async (req, res, next) => {
    try {
        const { searchTerm, type } = req.query; // type can be 'username', 'email', or 'both'
        
        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: "Please provide a search term"
            });
        }
        
        let searchCondition = {};
        
        switch(type) {
            case 'username':
                searchCondition = {
                    username: { $regex: searchTerm, $options: 'i' }
                };
                break;
            case 'email':
                searchCondition = {
                    email: { $regex: searchTerm, $options: 'i' }
                };
                break;
            default: // both
                searchCondition = {
                    $or: [
                        { username: { $regex: searchTerm, $options: 'i' } },
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } }
                    ]
                };
        }
        
        const users = await User.find(searchCondition)
            .select("-password")
            .limit(10); // Limit results
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
        
    } catch (error) {
        console.error("Advanced search error:", error);
        return res.status(500).json({
            success: false,
            message: "Error performing search",
            error: error.message
        });
    }
};
