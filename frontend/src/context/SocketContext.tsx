import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { socket } from "../socket";

type SocketContextType = {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);

      // Auto-register user on connect/reconnect
      const userId = localStorage.getItem("userId");
      if (userId) {
        console.log("Re-registering user after connect:", userId);
        socket.emit("join", userId);
        console.log("Join event emitted for user:", userId);
      } else {
        console.warn("Socket connected but no userId found in localStorage");
      }
    }

    function onDisconnect(reason: string) {
      console.log("Socket disconnected. Reason:", reason);
      setIsConnected(false);
    }

    // Set up event listeners FIRST to avoid race condition
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // If socket is already connected (e.g., after refresh with autoConnect: true),
    // immediately register the user
    if (socket.connected) {
      console.log("Socket already connected on mount, registering user");
      const userId = localStorage.getItem("userId");
      if (userId) {
        console.log("Registering user on initial mount:", userId);
        socket.emit("join", userId);
      }
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const connect = () => {
    if (!socket.connected) {
      socket.connect();
    }
  };

  const disconnect = () => {
    if (socket.connected) {
      socket.disconnect();
    }
  };

  return (
    <SocketContext.Provider value={{ isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
