import "../style/sideSection.css";
import { useCallback, useEffect, useState, useRef } from "react";
import type { UserSummary } from "../types/user";
import { apiUrl } from "../config/api";
import { Link, useNavigate } from "react-router-dom";

interface Conversation {
  user: UserSummary;
  lastMessage: string;
  time?: string;
  lastMessageAt?: string;
  lastMessageTime?: string;
}

type SideWindowProps = {
  activeUserId: string | null;
  onStartChat?: (user: UserSummary) => void;
  onEditProfile?: () => void;
};

export default function SideWindow({ 
  activeUserId, 
  onStartChat,
  onEditProfile 
}: SideWindowProps) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditMenu, setShowEditMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Set<string>>(new Set());
  const [headerImageFailed, setHeaderImageFailed] = useState(false);

  // Get user profile data from backend
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>(localStorage.getItem("userName") || "User");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowEditMenu(false);
      }
    };

    if (showEditMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEditMenu]);

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl("/api/chats/conversations"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(apiUrl("/api/users/me"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      const user = data.user || data;
      setProfilePic(user.profile_img || user.profileImg || null);
      setProfileName(user.name || user.username || profileName);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  }, [profileName]);

  // Fetch conversations from backend
  useEffect(() => {
    void fetchConversations();
    void fetchCurrentUser();
  }, [fetchConversations, fetchCurrentUser]);

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
    (conv.user.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const normalizeProfileUrl = (profile: unknown): string | null => {
    if (!profile) return null;
    if (typeof profile === "string") {
      const trimmed = profile.trim();
      return trimmed ? trimmed : null;
    }
    if (typeof profile === "object") {
      const maybeProfile = profile as Record<string, unknown>;
      const candidate = maybeProfile.imgUrl || maybeProfile.url || maybeProfile.profile_img;
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        return trimmed ? trimmed : null;
      }
    }
    return null;
  };

  // Get profile picture for a user
  const getUserProfilePic = (user: UserSummary) => {
    if (!user?._id || failedAvatarIds.has(user._id)) {
      return null;
    }

    return (
      normalizeProfileUrl(user.profile_img) ||
      normalizeProfileUrl(user.profilePic) ||
      normalizeProfileUrl(user.profilePicture)
    );
  };

  // Get display name for a user
  const getDisplayName = (user: UserSummary) => {
    return (user.name || user.username || "U").charAt(0).toUpperCase();
  };

  // Handle edit profile
  const handleEditProfile = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      navigate('/edit-profile');
    }
    setShowEditMenu(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate('/login');
    setShowEditMenu(false);
  };

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
          {/* Profile Avatar with Photo */}
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {profilePic && !headerImageFailed ? (
                <img 
                  src={profilePic} 
                  alt={`${profileName}'s profile`} 
                  className="avatar-image"
                  onError={() => setHeaderImageFailed(true)}
                />
              ) : (
                <span>{profileName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            {/* Edit button on avatar */}
            <Link
              to="/edit-profile"
              className="avatar-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
              }}
              aria-label="Edit profile"
              title="Edit profile"
            >
              ✏️
            </Link>
          </div>
          
          <div className="profile-info">
            <h3>{profileName}</h3>
            <p>🟢 Online</p>
          </div>
        </div>
        <div className="sidebar-actions">
          <button 
            className="action-icon"
            onClick={() => setShowEditMenu(!showEditMenu)}
          >
            ⋮
          </button>
          
          {/* Edit dropdown menu */}
          {showEditMenu && (
            <div className="avatar-edit-dropdown" ref={menuRef}>
              <button
                type="button"
                className="edit-option"
                onClick={handleEditProfile}
              >
                <span className="edit-option-icon">👤</span>
                Edit Profile
              </button>
              <button
                type="button"
                className="edit-option logout"
                onClick={handleLogout}
              >
                <span className="edit-option-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
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
          filteredConversations.map((conv) => {
            const userPic = getUserProfilePic(conv.user);
            const displayName = getDisplayName(conv.user);
            
            return (
              <div
                key={conv.user._id}
                className={`user-item ${activeUserId === conv.user._id ? "active" : ""}`}
                onClick={() => onStartChat?.(conv.user)}
              >
                {/* User Avatar with Photo */}
                <div className="user-avatar">
                  <div className="avatar-circle">
                    {userPic ? (
                      <img 
                        src={userPic} 
                        alt={`${conv.user.name || conv.user.username}'s profile`} 
                        className="avatar-image"
                        onError={() => setFailedAvatarIds((prev) => new Set(prev).add(conv.user._id))}
                      />
                    ) : (
                      displayName
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="user-info">
                  <div className="user-name-row">
                    <h4 className="user-name">{conv.user.name || conv.user.username}</h4>
                    <span className="message-time">
                      {formatTime(conv.time || conv.lastMessageAt || conv.lastMessageTime || new Date().toISOString())}
                    </span>
                  </div>
                  <div className="user-username">
                    @{conv.user.username}
                  </div>
                  <div className="last-message-row">
                    <p className="last-message">{conv.lastMessage}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}