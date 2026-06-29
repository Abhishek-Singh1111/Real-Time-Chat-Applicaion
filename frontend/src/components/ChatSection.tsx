import { useState, useEffect } from "react";
import "../style/chat.css";
import SideWindo from "../components/SideWindow";
import Nav from "./Nav";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { socket } from "../socket";
import { useChat } from "../hooks/useChat";
import type { ChatMessage } from "../types/chat";
import type { UserSummary } from "../types/user";

export default function ChatSection() {
  const [activeChatUser, setActiveChatUser] = useState<UserSummary | null>(null);

  const {
    messagesByUserId,
    fetchChatHistory,
    addMessage,
    updateMessage,
    removeMessage,
  } = useChat();

  // Listen for incoming socket messages
  useEffect(() => {
    const handleReceiveMessage = (chat: any) => {
      console.log("Received:", chat);

      const currentUserId = localStorage.getItem("userId");

      const newMessage: ChatMessage = {
        id: chat._id,
        text: chat.message || (chat.image_url ? "📷 Image" : ""),
        sender:
          chat.sender._id === currentUserId ? "me" : "other",
        time: new Date(chat.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        image_url: chat.image_url,
        createdAt: chat.createdAt,
      };

      // Store the message under the sender's conversation
      addMessage(chat.sender._id, newMessage);
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [addMessage]);

  const isMobile = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 640px)").matches;

  const handleStartChat = (user: UserSummary) => {
    setActiveChatUser(user);

    if (!messagesByUserId[user._id]) {
      void fetchChatHistory(user._id);
    }
  };

  const handleBackToList = () => {
    if (!isMobile()) return;
    setActiveChatUser(null);
  };

  const handleNewMessage = (message: ChatMessage) => {
    if (!activeChatUser) return;

    addMessage(activeChatUser._id, message);
  };

  const handleUpdateMessage = (tempId: string, message: ChatMessage) => {
    if (!activeChatUser) return;

    updateMessage(activeChatUser._id, tempId, message);
  };

  const handleRemoveMessage = (tempId: string) => {
    if (!activeChatUser) return;

    removeMessage(activeChatUser._id, tempId);
  };

  const activeMessages =
    messagesByUserId[activeChatUser?._id ?? ""] ?? [];

  return (
    <div className="chat-app">
      <Nav onStartChat={handleStartChat} />

      <div
        className={`chat-main ${
          activeChatUser ? "mobile-chat-open" : ""
        }`}
      >
        <SideWindo
          activeUserId={activeChatUser?._id ?? null}
          onStartChat={handleStartChat}
        />

        <div className="chat-section">
          <ChatHeader
            activeChatUser={activeChatUser}
            onBack={handleBackToList}
          />

          <ChatMessages
            messages={activeMessages}
            isChatActive={!!activeChatUser}
          />

          <ChatInput
            activeChatUser={activeChatUser}
            onNewMessage={handleNewMessage}
            onUpdateMessage={handleUpdateMessage}
            onRemoveMessage={handleRemoveMessage}
          />
        </div>
      </div>
    </div>
  );
}