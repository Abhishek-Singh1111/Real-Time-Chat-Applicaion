import { FaHome } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Search from "./Search";
import { useState, useEffect } from "react";
import "../style/Nav.css";
import type { UserSummary } from "../types/user";

type NavProps = {
  onStartChat?: (user: UserSummary) => void;
};

export default function Nav({ onStartChat }: NavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check login status on mount
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      const storedName = localStorage.getItem('userName');
      const storedEmail = localStorage.getItem('userEmail');
      setProfileName(storedName || storedEmail);
      setProfileEmail(storedName ? storedEmail : null);
    };

    checkLoginStatus();
    
    // Listen for storage changes
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setProfileName(null);
    setProfileEmail(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="nav">
      <div className="nav-left">
        <Link to="/" className="home-icon">
          <FaHome />
        </Link>
      </div>

      <div className="nav-center">
        {isLoggedIn ? <Search onStartChat={onStartChat} /> : null}
      </div>

      <div className="nav-right">
        {isLoggedIn ? (
          <>
          <button type="button" onClick={handleLogout} className="logout-button">
            <FiLogOut aria-hidden="true" focusable="false" />
            Logout
          </button>
            <div className="nav-profile" title={profileEmail || profileName || ""}>
              <div className="nav-profile-avatar" aria-hidden="true">
                {(profileName || "G").charAt(0).toUpperCase()}
              </div>
              <div className="nav-profile-meta">
                <div className="nav-profile-name">{profileName || "Guest"}</div>
                {profileEmail ? (
                  <div className="nav-profile-email">{profileEmail}</div>
                ) : null}
              </div>
            </div>
          </>
          
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </div>
  );
}
