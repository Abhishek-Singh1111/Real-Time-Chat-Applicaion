import { FaHome } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Search from "./Search";
import { useEffect, useRef, useState } from "react";
import "../style/Nav.css";
import type { UserSummary } from "../types/user";

type NavProps = {
  onStartChat?: (user: UserSummary) => void;
};

export default function Nav({ onStartChat }: NavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setProfileName(null);
    setProfileEmail(null);
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="nav">
      <div className="nav-left">
        <Link to="/" className="home-icon" aria-label="Home">
          <FaHome aria-hidden="true" focusable="false" />
        </Link>
      </div>

      <div className="nav-center">
        {isLoggedIn ? <Search onStartChat={onStartChat} /> : null}
      </div>

      <div className="nav-right">
        {isLoggedIn ? (
          <div className="nav-profile-wrap" ref={menuRef}>
            <button
              type="button"
              className="nav-profile"
              title={profileEmail || profileName || ""}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <div className="nav-profile-avatar" aria-hidden="true">
                {(profileName || "G").charAt(0).toUpperCase()}
              </div>
              <div className="nav-profile-meta">
                <div className="nav-profile-name">{profileName || "Guest"}</div>
                {profileEmail ? (
                  <div className="nav-profile-email">{profileEmail}</div>
                ) : null}
              </div>
            </button>

            <div className={`nav-menu ${menuOpen ? "open" : ""}`} role="menu">
              <button type="button" className="nav-menu-item" role="menuitem" onClick={handleLogout}>
                <FiLogOut aria-hidden="true" focusable="false" />
                Logout
              </button>
            </div>
          </div>
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
