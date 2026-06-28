import type { UserSummary } from "../types/user";

interface ChatHeaderProps {
  activeChatUser: UserSummary | null;
  onBack: () => void;
}

export default function ChatHeader({ activeChatUser, onBack }: ChatHeaderProps) {

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
          <span>
            {activeChatUser 
              ? `@${activeChatUser.username}` 
              : "Search a user and click Message"}
          </span>
        </div>
      </div>
    </div>
  );
}