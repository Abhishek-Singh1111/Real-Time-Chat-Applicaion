import { useState, useCallback } from "react";
import type { ChatMessage } from "../types/chat";
import { apiUrl } from "../config/api";

const getToken = () => localStorage.getItem("token");

export function useChat() {
  const [messagesByUserId, setMessagesByUserId] = useState<Record<string, ChatMessage[]>>({});

  const fetchChatHistory = useCallback(async (receiverId: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(apiUrl(`/api/chats/history/${receiverId}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.chats) {
        setMessagesByUserId((prev) => ({
          ...prev,
          [receiverId]: data.chats
        }));
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, []);

  const addMessage = (userId: string, message: ChatMessage) => {
    setMessagesByUserId((prev) => {
      const existing = prev[userId] ?? [];
      return { ...prev, [userId]: [...existing, message] };
    });
  };

  const updateMessage = (userId: string, tempId: string, updatedMessage: ChatMessage) => {
    setMessagesByUserId((prev) => {
      const updatedMessages = (prev[userId] || []).map(msg =>
        msg.id === tempId ? updatedMessage : msg
      );
      return { ...prev, [userId]: updatedMessages };
    });
  };

  const removeMessage = (userId: string, tempId: string) => {
    setMessagesByUserId((prev) => {
      const updatedMessages = (prev[userId] || []).filter(
        msg => msg.id !== tempId
      );
      return { ...prev, [userId]: updatedMessages };
    });
  };

  return {
    messagesByUserId,
    fetchChatHistory,
    addMessage,
    updateMessage,
    removeMessage
  };
}