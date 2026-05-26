import "../style/Search.css";
import { useState } from "react";
import type { UserSummary } from "../types/user";

type SearchProps = {
  onStartChat?: (user: UserSummary) => void;
};

export default function Search({ onStartChat }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchType, setSearchType] = useState<"username" | "email" | "both">("both");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setMessage({ text: "Please enter a username or email", type: "error" });
      return;
    }
    
    setLoading(true);
    setMessage({ text: "", type: "" });
    setUsers([]);
    
    try {
      let url = "";
      
      // Choose which API endpoint to use
      if (searchType === "both") {
        url = `http://localhost:8000/api/users/search?query=${encodeURIComponent(searchQuery)}`;
      } else {
        url = `http://localhost:8000/api/users/advanced-search?searchTerm=${encodeURIComponent(searchQuery)}&type=${searchType}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        if (data.data && data.data.length > 0) {
          setUsers(data.data);
          setMessage({ text: `Found ${data.count || data.data.length} user(s)`, type: "success" });
        } else {
          setMessage({ text: "No users found with the provided search term", type: "error" });
        }
      } else {
        setMessage({ text: data.message || "Search failed", type: "error" });
      }
    } catch (error) {
      console.error("Search error:", error);
      setMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setUsers([]);
    setMessage({ text: "", type: "" });
  };

  const handleStartChat = (user: UserSummary) => {
    onStartChat?.(user);
    setUsers([]);
    setMessage({ text: "", type: "" });
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h2>Search Users</h2>
        <p>Find users by username or email</p>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-type-selector">
          <label>
            <input
              type="radio"
              value="both"
              checked={searchType === "both"}
              onChange={(e) => setSearchType(e.target.value as "username" | "email" | "both")}
            />
            Search Both
          </label>
          <label>
            <input
              type="radio"
              value="username"
              checked={searchType === "username"}
              onChange={(e) => setSearchType(e.target.value as "username" | "email" | "both")}
            />
            Username Only
          </label>
          <label>
            <input
              type="radio"
              value="email"
              checked={searchType === "email"}
              onChange={(e) => setSearchType(e.target.value as "username" | "email" | "both")}
            />
            Email Only
          </label>
        </div>

        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder={
              searchType === "username" 
                ? "Enter username..." 
                : searchType === "email" 
                ? "Enter email..." 
                : "Enter username or email..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
          {searchQuery && (
            <button type="button" className="clear-btn" onClick={clearSearch}>
              ✕
            </button>
          )}
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {message.text && (
        <div className={`search-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {users.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>Search Results</h3>
            <span className="results-count">{users.length} user(s) found</span>
          </div>
          
          <div className="users-list">
            {users.map((user) => (
              <div key={user._id} className="user-card">
                <div className="user-avatar">
                  {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {user.name || user.username}
                  </div>
                  <div className="user-username">
                    @{user.username}
                  </div>
                  <div className="user-email">
                    {user.email}
                  </div>
                </div>
                <button className="chat-btn" type="button" onClick={() => handleStartChat(user)}>
                  💬 Message
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
