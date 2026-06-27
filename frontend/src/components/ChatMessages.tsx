import { useState } from "react";
import type { ChatMessage } from "../types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isChatActive: boolean;
}

export default function ChatMessages({ messages, isChatActive }: ChatMessagesProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <>
      <div className="chat-messages">
        {!isChatActive ? (
        <div className="message received">
          <div className="message-bubble">Select a user to start chatting</div>
        </div>
      ) : messages.length === 0 ? (
        <div className="message received">
          <div className="message-bubble">Send a message to start chatting!</div>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender === "me" ? "sent" : "received"}`}>
            <div className="message-bubble">
              {msg.image_url && msg.image_url !== "uploading..." && (
                <img 
                  src={msg.image_url} 
                  alt="Shared" 
                  onClick={() => setActiveImage(msg.image_url ?? null)}
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    cursor: 'pointer',
                    objectFit: 'cover',
                  }}
                />
              )}
              {msg.text && msg.text !== "📷 Image" && <div>{msg.text}</div>}
              {msg.image_url === "uploading..." && <div>📤 Uploading...</div>}
              <span className="message-time">{msg.time}</span>
            </div>
          </div>
        ))
      )}
    </div>

    {activeImage && (
      <div className="image-preview-overlay" onClick={() => setActiveImage(null)}>
        <div className="image-preview-content" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="image-preview-close"
            onClick={() => setActiveImage(null)}
          >
            ✕
          </button>
          <img src={activeImage} alt="Preview" />
        </div>
      </div>
    )}
  </>
);
}