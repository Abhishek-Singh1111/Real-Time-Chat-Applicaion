import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

const isBrowser = typeof window !== "undefined";

const normalizeUrl = (value: string) =>
  value.trim().replace(/\/+$/g, "");

const SOCKET_URL = normalizeUrl(API_BASE_URL);

export let socket: Socket | null = null;

export const initSocketClient = (): Socket => {
  if (!isBrowser) {
    throw new Error("Socket client can only be initialized in the browser.");
  }

  if (socket) {
    return socket;
  }

  if (!SOCKET_URL) {
    throw new Error("VITE_API_URL must be set for socket initialization.");
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: true,
    upgrade: true,
    forceNew: false,
    extraHeaders: {
      // Some cloud platforms may require a custom header for auth
      // or handshake validation. Keep this minimal.
    },
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
  });

  return socket;
};
