import { useEffect, useState } from "react";
import "../style/chat.css";
import SideWindo from '../components/SideWindow';
import Nav from "./Nav";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { useChat } from "../hooks/useChat";
// import { initSocketClient } from "../config/socket";
import type { UserSummary } from "../types/user";
export default function ChatSection() {
  const [activeChatUser, setActiveChatUser] = useState<UserSummary | null>(null);
  const { messagesByUserId, fetchChatHistory, addMessage, updateMessage, removeMessage } = useChat();



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

  const handleNewMessage = (message: any) => {
    if (!activeChatUser) return;
    addMessage(activeChatUser._id, message);
  };

  const handleUpdateMessage = (tempId: string, message: any) => {
    if (!activeChatUser) return;
    updateMessage(activeChatUser._id, tempId, message);
  };

  const handleRemoveMessage = (tempId: string) => {
    if (!activeChatUser) return;
    removeMessage(activeChatUser._id, tempId);
  };

  const activeMessages = messagesByUserId[activeChatUser?._id ?? ""] ?? [];

  return (
    <div className="chat-app">
      <Nav onStartChat={handleStartChat} />
      
      <div className={`chat-main ${activeChatUser ? "mobile-chat-open" : ""}`}>
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