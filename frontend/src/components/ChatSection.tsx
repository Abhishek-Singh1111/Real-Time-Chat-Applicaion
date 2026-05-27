import "../style/chat.css";
import { useMemo, useState, useCallback } from "react";
import SideWindo from '../components/SideWindow';
import Nav from "./Nav";
import type { UserSummary } from "../types/user";
import { apiUrl } from "../config/api";

type ChatMessage = {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  createdAt?: string;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getToken = () => localStorage.getItem("token");

const getCurrentUserIdFromToken = (token: string | null) => {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { userId?: string };
    return payload.userId ?? null;
  } catch {
    return null;
  }
};

const normalizeId = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as { _id?: string; id?: string };
    return obj._id ?? obj.id ?? null;
  }
  return String(value);
};

export default function ChatSection() {
  const [activeChatUser, setActiveChatUser] = useState<UserSummary | null>(null);
  const [messagesByUserId, setMessagesByUserId] = useState<Record<string, ChatMessage[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 640px)").matches;

  // Fetch chat history from backend
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
        const currentUserId = getCurrentUserIdFromToken(token);

        // Convert backend messages to frontend format
        const formattedMessages: ChatMessage[] = (data.chats as unknown[]).map((chat) => {
          const chatObj = chat as {
            _id: string;
            message: string;
            sender: unknown;
            receiver: unknown;
            createdAt: string;
          };

          const senderId = normalizeId(chatObj.sender);
          const receiverIdInChat = normalizeId(chatObj.receiver);

          const isFromOtherUser = !!senderId && String(senderId) === String(receiverId);
          const isToOtherUser = !!receiverIdInChat && String(receiverIdInChat) === String(receiverId);

          const isMe =
            (isToOtherUser && !isFromOtherUser) ||
            (!!currentUserId && !!senderId && String(senderId) === String(currentUserId));

          return {
            id: chatObj._id,
            text: chatObj.message,
            sender: isMe ? "me" : "other",
            time: formatTime(new Date(chatObj.createdAt)),
            createdAt: chatObj.createdAt,
          };
        });
        
        setMessagesByUserId((prev) => ({
          ...prev,
          [receiverId]: formattedMessages
        }));
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, []);

  const handleStartChat = (user: UserSummary) => {
    setActiveChatUser(user);
    setMessagesByUserId((prev) => {
      if (prev[user._id]) return prev;
      return { ...prev, [user._id]: [] };
    });
    void fetchChatHistory(user._id);
  };

  const handleBackToList = () => {
    if (!isMobile()) return;
    setActiveChatUser(null);
    setNewMessage("");
  };

  // Send message to backend
  const sendMessageToBackend = async (receiverId: string, message: string) => {
    try {
      const token = getToken();
      if (!token) return null;

      const response = await fetch(apiUrl("/api/chats/send"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver: receiverId,
          message: message
        })
      });

      const data = await response.json();

      if (response.ok) {
        return data.chat;
      } else {
        console.error("Failed to send message:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser) return;
    if (!newMessage.trim()) return;

    setIsLoading(true);
    
    // Create temporary message for immediate display
    const tempMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: newMessage,
      sender: "me",
      time: formatTime(new Date()),
    };

    // Add message to UI immediately
    const userId = activeChatUser._id;
    setMessagesByUserId((prev) => {
      const existing = prev[userId] ?? [];
      return { ...prev, [userId]: [...existing, tempMessage] };
    });
    
    setNewMessage("");

    // Send to backend
    const savedChat = await sendMessageToBackend(userId, newMessage);
    
    if (savedChat) {
      // Update message with real ID from backend
      setMessagesByUserId((prev) => {
        const updatedMessages = prev[userId].map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: savedChat._id, createdAt: savedChat.createdAt }
            : msg
        );
        return { ...prev, [userId]: updatedMessages };
      });
    }
    
    setIsLoading(false);
  };

  const activeMessages = useMemo(() => {
    if (!activeChatUser) return [];
    return messagesByUserId[activeChatUser._id] ?? [];
  }, [activeChatUser, messagesByUserId]);

  return (
    <div className="chat-app">
      <Nav onStartChat={handleStartChat} />
      
      <div className={`chat-main ${activeChatUser ? "mobile-chat-open" : ""}`}>
        <SideWindo
          activeUserId={activeChatUser?._id ?? null}
          onStartChat={handleStartChat}
        />
        
        {/* Chat Section on right */}
        <div className="chat-section">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <button
                type="button"
                className="chat-back"
                onClick={handleBackToList}
                aria-label="Back"
              >
                ←
              </button>
	              <div className="avatar" aria-hidden="true">
	                {activeChatUser ? (activeChatUser.name || activeChatUser.username).charAt(0).toUpperCase() : "U"}
	              </div>
              <div className="contact-info">
                <h3>{activeChatUser ? (activeChatUser.name || activeChatUser.username) : "Select a chat"}</h3>
                <span>{activeChatUser ? `@${activeChatUser.username}` : "Search a user and click Message"}</span>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="chat-messages">
            {activeMessages.length === 0 ? (
              <div className="message received">
                <div className="message-bubble">
                  Send a message to start chatting!
                </div>
              </div>
            ) : (
              activeMessages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender === "me" ? "sent" : "received"}`}>
                  <div className="message-bubble">
                    {msg.text}
                    <span className="message-time">{msg.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input Form */}
          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type a message"
              className="chat-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!activeChatUser || isLoading}
            />
            <button type="submit" className="chat-submit" disabled={!activeChatUser || isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
