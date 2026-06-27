import React, { useState, useRef } from "react";
import type { UserSummary } from "../types/user";
import type { ChatMessage } from "../types/chat";
import { apiUrl } from "../config/api";

interface ChatInputProps {
  activeChatUser: UserSummary | null;
  onNewMessage: (message: ChatMessage) => void;
  onUpdateMessage: (tempId: string, message: ChatMessage) => void;
  onRemoveMessage: (tempId: string) => void;
}

const getToken = () => localStorage.getItem("token");
const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatInput({ 
  activeChatUser, 
  onNewMessage, 
  onUpdateMessage,
  onRemoveMessage 
}: ChatInputProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChatActive = !!activeChatUser;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Please select a valid image (JPEG, PNG, GIF, WEBP)');
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser) {
      alert("Please select a chat first");
      return;
    }
    if (!newMessage.trim() && !file) return;

    setIsLoading(true);
    const userId = activeChatUser._id;

    // Create temporary message
    const tempMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: newMessage.trim() || (file ? "📷 Image" : ""),
      sender: "me",
      time: formatTime(new Date()),
      image_url: file ? "uploading..." : undefined,
    };

    // Add to UI immediately
    onNewMessage(tempMessage);

    const messageText = newMessage.trim();
    setNewMessage("");
    const selectedFile = file;
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      if (selectedFile) {
        formData.append("my_file", selectedFile);
      }
      if (messageText) {
        formData.append("message", messageText);
      }
      formData.append("receiver", userId);

      const response = await fetch(apiUrl("/api/chats/send"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.chat) {
        // Update message with real data
        const updatedMessage: ChatMessage = {
          ...tempMessage,
          id: data.chat._id,
          text: data.chat.message || "📷 Image",
          image_url: data.chat.image_url,
          createdAt: data.chat.createdAt,
          time: formatTime(new Date(data.chat.createdAt))
        };
        onUpdateMessage(tempMessage.id, updatedMessage);
      } else {
        // Remove temp message if failed
        onRemoveMessage(tempMessage.id);
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error:", error);
      onRemoveMessage(tempMessage.id);
      alert("Failed to send message");
    }

    setIsLoading(false);
  };

  return (
    <form className="chat-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={isChatActive ? "Type a message..." : "Select a chat first"}
        className="chat-input"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        disabled={!isChatActive || isLoading}
      />
      
      <label 
        htmlFor="file" 
        style={{ 
          cursor: isChatActive ? 'pointer' : 'not-allowed', 
          fontSize: '20px',
          opacity: isChatActive ? 1 : 0.5
        }}
      >
        📎
      </label>
      <input
        id="file"
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={!isChatActive || isLoading}
      />
      
      {file && (
        <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
          {file.name}
        </span>
      )}

      <button 
        type="submit" 
        className="chat-submit" 
        disabled={!isChatActive || isLoading}
      >
        {isLoading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}