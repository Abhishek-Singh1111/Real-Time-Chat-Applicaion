const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    username: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

   
    chats: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat"
        }
    ],

    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
},
{
    timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);
