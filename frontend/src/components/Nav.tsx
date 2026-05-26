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
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check login status on mount
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      setUserName(localStorage.getItem('userEmail'));
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
            <div className="profile">
              <span className="profile-label">Profile:</span>
              <span className="profile-name">{userName || 'Guest'}</span>
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
