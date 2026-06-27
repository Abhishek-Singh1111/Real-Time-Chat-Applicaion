import { useCallback, useState } from "react";
import { apiUrl } from "../config/api";
import type { ChatMessage } from "../types/chat";

type MessagesByUserId = Record<string, ChatMessage[]>;

export function useChat() {
  const [messagesByUserId, setMessagesByUserId] = useState<MessagesByUserId>({});

  const getCurrentUserId = () => localStorage.getItem("userId") ?? "";

  const fetchChatHistory = useCallback(async (receiverId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(apiUrl(`/api/chats/history/${receiverId}`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const currentUserId = getCurrentUserId();

      const history: ChatMessage[] = (data.chats || []).map((chat: any) => ({
        id: chat._id || chat.id,
        text: chat.message || (chat.image_url ? "📷 Image" : ""),
        sender: chat.sender?._id?.toString() === currentUserId ? "me" : "other",
        time: new Date(chat.createdAt || chat.updatedAt || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        image_url: chat.image_url,
        createdAt: chat.createdAt,
      }));

      setMessagesByUserId((prev) => ({
        ...prev,
        [receiverId]: history,
      }));
    } catch (error) {
      console.error("fetchChatHistory error:", error);
    }
  }, []);

  const addMessage = useCallback((receiverId: string, message: ChatMessage) => {
    setMessagesByUserId((prev) => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] ?? []), message],
    }));
  }, []);

  const updateMessage = useCallback((receiverId: string, tempId: string, message: ChatMessage) => {
    setMessagesByUserId((prev) => ({
      ...prev,
      [receiverId]: prev[receiverId]?.map((item) => (item.id === tempId ? message : item)) ?? [],
    }));
  }, []);

  const removeMessage = useCallback((receiverId: string, tempId: string) => {
    setMessagesByUserId((prev) => ({
      ...prev,
      [receiverId]: prev[receiverId]?.filter((item) => item.id !== tempId) ?? [],
    }));
  }, []);

  return {
    messagesByUserId,
    fetchChatHistory,
    addMessage,
    updateMessage,
    removeMessage,
  };
}
