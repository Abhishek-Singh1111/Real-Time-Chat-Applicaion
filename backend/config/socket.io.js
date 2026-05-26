const { Server } = require("socket.io");

const socketConfig = (server) => {

    const io = new Server(server, {

        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {

        console.log("User connected:", socket.id);

        socket.on("send message", (chat) => {

            io.emit("receive message", chat);
        });

        socket.on("disconnect", () => {

            console.log("User disconnected");
        });
    });
};

module.exports = socketConfig;