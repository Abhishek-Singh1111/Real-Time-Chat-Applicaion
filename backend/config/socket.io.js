const { Server } = require("socket.io");

const normalizeOrigin = (value) =>
    String(value || "").trim().replace(/\/+$|\s+/g, "");

const parseOrigins = (value) =>
    String(value || "")
        .split(/[,;]+/)
        .map(normalizeOrigin)
        .filter(Boolean);

const socketConfig = (server) => {
    const allowedOrigins = [
        ...parseOrigins(process.env.CORS_ORIGIN),
        "http://localhost:5173",
        "http://localhost:3000",
    ].filter(Boolean);

    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);

                const normalizedOrigin = normalizeOrigin(origin);
                if (allowedOrigins.includes(normalizedOrigin)) {
                    return callback(null, true);
                }

                const err = new Error(`Socket.IO CORS blocked origin: ${origin}`);
                return callback(err);
            },
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("send message", (chat) => {
            io.emit("receive message", chat);
        });

        socket.on("disconnect", (reason) => {
            console.log("User disconnected", reason);
        });
    });
};

module.exports = socketConfig;