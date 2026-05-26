import "../style/sideSection.css";
import { useState, useEffect } from "react";

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
}

interface Conversation {
  user: User;
  lastMessage: string;
  time: string;
}

export default function SideWindow() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch conversations from backend
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/chats/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
        console.log("Conversations:", data.conversations);
      } else {
        setError(data.message || "Failed to load conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format time display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="sideWindow">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sideWindow">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchConversations} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sideWindow">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="profile-section">
          <div className="profile-avatar">
            <span>M</span>
          </div>
          <div className="profile-info">
            <h3>My Account</h3>
            <p>Online</p>
          </div>
        </div>
        <div className="sidebar-actions">
          <button className="action-icon">⚙️</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Users/Chats List */}
      <div className="users-list">
        {filteredConversations.length === 0 ? (
          <div className="no-results">
            <p>No chats found</p>
            <p className="sub-text">Start a new conversation by searching for users</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.user._id}
              className={`user-item ${activeUserId === conv.user._id ? "active" : ""}`}
              onClick={() => setActiveUserId(conv.user._id)}
            >
              {/* User Avatar */}
              <div className="user-avatar">
                <div className="avatar-circle">
                  {conv.user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* User Info */}
              <div className="user-info">
                <div className="user-name-row">
                  <h4 className="user-name">{conv.user.name}</h4>
                  <span className="message-time">{formatTime(conv.time)}</span>
                </div>
                <div className="user-username">
                  @{conv.user.username}
                </div>
                <div className="last-message-row">
                  <p className="last-message">{conv.lastMessage}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}