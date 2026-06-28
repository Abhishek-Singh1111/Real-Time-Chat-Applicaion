import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/EditUser.css";
import { apiUrl } from "../config/api";

export default function EditUser() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");

  // Load user data
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMsg("Please login first");
        return;
      }

      console.log("API URL:", apiUrl("/api/users/me")); // Should show: http://localhost:8000/api/users/me

      const res = await fetch(apiUrl("/api/users/me"), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.user || data;
        
        setName(user.name || user.username || "User");
        
        const pic = user.profile_img || null;
        if (pic) {
          setPhoto(pic);
        }
      } else {
        const data = await res.json();
        setMsg(data.message || "Failed to load user");
      }
    } catch (err) {
      console.error("Load user error:", err);
      setMsg("Network error - check if server is running");
    }
  };

  // Select file
  const selectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMsg("File too large (max 5MB)");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMsg("Please select an image");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
    setMsg("");
  };

  // Upload photo
  const uploadPhoto = async () => {
    if (!photo) {
      setMsg("Please select a photo");
      return;
    }

    setLoading(true);
    setMsg("Uploading...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMsg("Please login");
        setLoading(false);
        return;
      }

      // Convert to file
      const blob = await fetch(photo).then(r => r.blob());
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("profile_img", file);

      console.log("Uploading to:", apiUrl("/api/users/update-profile"));

      const res = await fetch(apiUrl("/api/users/update-profile"), {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      console.log("Response status:", res.status);

      const data = await res.json();
      console.log("Response data:", data);

      if (res.ok) {
        const profileUrl = data.user?.profile_img || data.user?.profileImg || photo;
        setPhoto(profileUrl);
        setMsg("✅ Photo updated successfully!");
        setTimeout(() => navigate(-1), 1500);
      } else {
        setMsg(data.message || `Server error: ${res.status}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMsg(`Network error: ${err.message || "Please check your connection"}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="edit-container">
      <div className="edit-card">
        <div className="edit-header">
          <button onClick={() => navigate(-1)} className="back-btn">←</button>
          <h2>Update Photo</h2>
          <div style={{ width: 40 }}></div>
        </div>

        {msg && (
          <div className={msg.includes("✅") ? "success-message" : "error-message"}>
            {msg}
          </div>
        )}

        <div className="profile-pic-wrapper" onClick={() => fileInputRef.current?.click()}>
          {photo ? (
            <img src={photo} alt="Profile" />
          ) : (
            <div className="placeholder">{name.charAt(0).toUpperCase()}</div>
          )}
          <div className="overlay">📷 Change</div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={selectFile}
          accept="image/*"
          style={{ display: "none" }}
        />

        <div className="pic-actions">
          <button onClick={() => fileInputRef.current?.click()}>Select Photo</button>
          {photo && <button onClick={removePhoto}>Remove</button>}
        </div>

        <div className="form-group">
          <label>Username</label>
          <input type="text" value={name} disabled />
        </div>

        <div className="form-actions">
          <button onClick={() => navigate(-1)} disabled={loading}>Cancel</button>
          <button onClick={uploadPhoto} disabled={loading || !photo}>
            {loading ? "Uploading..." : "Update Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}