import "./style/signup.css";
import { useState } from "react";
import { apiUrl } from "./config/api";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",      // Changed from "username" to "name"
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear message when user starts typing
    if (message.text) setMessage({ text: "", type: "" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setMessage({ text: "Please fill all fields", type: "error" });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/signup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Sends { name, email, password }
      });
      
      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "Signup successful! 🎉", type: "success" });
        // Clear form
        setFormData({ name: "", email: "", password: "" });
        // Store token if needed
        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("userId", data.data.userId || "");
          localStorage.setItem("userName", data.data.name || "");
          localStorage.setItem("userEmail", data.data.email || "");
          console.log("Token saved:", data.data.token);
        }
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);

      } else {
        setMessage({ text: data.message || "Signup failed", type: "error" });
      }

      console.log(data);
    } catch (error) {
      console.log(error);
      setMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="whatsapp-header">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.01 1 4.31L2.5 21.5l5.19-1.5c1.3.64 2.77 1 4.31 1 5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="#25D366"/>
            <path d="M12 4c4.42 0 8 3.58 8 8s-3.58 8-8 8c-1.43 0-2.77-.38-3.93-1.04L7 18.18l-2.28.66.68-2.28c-.66-1.16-1.04-2.5-1.04-3.93 0-4.42 3.58-8 8-8z" fill="white"/>
          </svg>
          <h2>Create Account</h2>
          <p>Join WhatsApp Web</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Full Name</label>  {/* Changed from Username */}
          <input
            type="text"
            id="name"
            name="name"  // Changed from "username"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="signin-link">
          Already have an account? <a href="/login">Sign in</a>
        </div>
      </form>
    </div>
  );
}
