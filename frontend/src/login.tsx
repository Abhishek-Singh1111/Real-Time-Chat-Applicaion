import "./style/signup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";
import { useSocket } from "./context/SocketContext";
import { socket } from "./socket";

export default function Login() {
  const navigate = useNavigate();
  const { connect } = useSocket();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (message.text) {
      setMessage({
        text: "",
        type: "",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setMessage({
        text: "Please fill all fields",
        type: "error",
      });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({
        text: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
       console.log("LOGIN RESPONSE:", data);
       console.log("STATUS:", response.status);
      if (response.ok) {
        console.log("LOGIN SUCCESS");
        setMessage({
          text: "Login successful! 🎉",
          type: "success",
        });

        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("userId", data.data.userId);
          localStorage.setItem("userName", data.data.name || "");
          localStorage.setItem("userEmail", data.data.email || "");
        }

        setFormData({
          email: "",
          password: "",
        });

        // Connect socket and join
        connect();

        // Wait for socket to be connected before emitting join
        const tryJoin = () => {
          if (socket.connected) {
            socket.emit("join", data.data.userId);
            console.log("Join emitted:", data.data.userId);
            navigate("/");
          } else {
            // If not connected yet, wait a bit and retry
            setTimeout(tryJoin, 100);
          }
        };

        tryJoin();
      } else {
        if (
          data.message === "User not found" ||
          data.message === "Invalid email or password"
        ) {
          setMessage({
            text: "User does not exist. Please sign up first.",
            type: "error",
          });
        } else {
          setMessage({
            text: data.message || "Login failed",
            type: "error",
          });
        }
      }
    } catch (error) {
      console.error(error);

      setMessage({
        text: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="whatsapp-header">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.01 1 4.31L2.5 21.5l5.19-1.5c1.3.64 2.77 1 4.31 1 5.52 0 10-4.48 10-10S17.52 2 12 2z"
              fill="#25D366"
            />
            <path
              d="M12 4c4.42 0 8 3.58 8 8s-3.58 8-8 8c-1.43 0-2.77-.38-3.93-1.04L7 18.18l-2.28.66.68-2.28c-.66-1.16-1.04-2.5-1.04-3.93 0-4.42 3.58-8 8-8z"
              fill="white"
            />
          </svg>

          <h2>Welcome Back</h2>
          <p>Sign in to continue</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-group">
          <label>Email</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <div className="signin-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </div>
      </form>
    </div>
  );
}