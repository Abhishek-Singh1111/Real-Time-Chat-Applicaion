import type { UserSummary } from "../types/user";
import { useOnlineUsers } from "../hooks/isUserOnline";

interface ChatHeaderProps {
  activeChatUser: UserSummary | null;
  onBack: () => void;
}

export default function ChatHeader({ activeChatUser, onBack }: ChatHeaderProps) {
  const { isUserOnline } = useOnlineUsers();

  // For the active chat user's profile pic
  const getActiveUserPic = () => {
    if (!activeChatUser) return null;
    return (
      activeChatUser.profile_img ||
      activeChatUser.profilePic ||
      activeChatUser.profilePicture ||
      null
    );
  };

  const activeUserPic = getActiveUserPic();

  const online = activeChatUser ? isUserOnline(activeChatUser._id) : false;

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <button
          type="button"
          className="chat-back"
          onClick={onBack}
          aria-label="Back"
        >
          ←
        </button>
        
        <div className="avatar" aria-hidden="true">
          {activeUserPic ? (
            <img 
              src={activeUserPic} 
              alt={activeChatUser?.name || "User"} 
              className="avatar-image"
            />
          ) : (
            activeChatUser 
              ? (activeChatUser.name || activeChatUser.username).charAt(0).toUpperCase() 
              : "U"
          )}
        </div>
        
        <div className="contact-info">
          <h3>
            {activeChatUser 
              ? (activeChatUser.name || activeChatUser.username) 
              : "Select a chat"}
          </h3>
          <span className={online ? "status-online" : "status-offline"}>
            {activeChatUser 
              ? (online ? "Online" : "Offline") 
              : "Search a user and click Message"}
          </span>
        </div>
      </div>
    </div>
  );
}
