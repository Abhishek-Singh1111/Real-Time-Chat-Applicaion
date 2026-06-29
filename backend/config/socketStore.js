
const { Server } = require("socket.io");

let io = null;
const onlineUsers = {};

function setIO(serverInstance) {
    io = serverInstance;
}

function getIO() {
    return io;
}

function getOnlineUsers() {
    return onlineUsers;
}

function addOnlineUser(userId, socketId) {
    onlineUsers[userId] = socketId;
}

function removeOnlineUserBySocketId(socketId) {
    for (const userId in onlineUsers) {
        if (onlineUsers[userId] === socketId) {
            delete onlineUsers[userId];
            return userId; // Return the disconnected userId
        }
    }
    return null; // No user found for this socket
}

module.exports = {
    setIO,
    getIO,
    getOnlineUsers,
    addOnlineUser,
    removeOnlineUserBySocketId,
};