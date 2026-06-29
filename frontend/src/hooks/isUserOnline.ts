import { useState, useEffect } from "react";
import { socket } from "../socket";

type OnlineUsersState = Record<string, boolean>;

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUsersState>({});

  useEffect(() => {
    // Listen for user online event
    const handleUserOnline = (userId: string) => {
      console.log("User came online:", userId);
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: true,
      }));
    };

    // Listen for user offline event
    const handleUserOffline = (userId: string) => {
      console.log("User went offline:", userId);
      setOnlineUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    // Listen for initial online users list from server
    const handleOnlineUsersList = (users: string[]) => {
      console.log("Received online users list:", users);
      const onlineMap: OnlineUsersState = {};
      users.forEach((userId) => {
        onlineMap[userId] = true;
      });
      setOnlineUsers(onlineMap);
    };

    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("online_users_list", handleOnlineUsersList);

    return () => {
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("online_users_list", handleOnlineUsersList);
    };
  }, []);

  const isUserOnline = (userId: string | undefined): boolean => {
    if (!userId) return false;
    return onlineUsers[userId] === true;
  };

  return {
    onlineUsers,
    isUserOnline,
  };
}