import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "../config/api";

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profile_img: string;
  chats: string[];
  friends: string[];
  createdAt: string;
  updatedAt: string;
}

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl("/api/users/me"), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        const userData = data.user || data;
        setUser(userData);
        
        // Update localStorage for other components
        if (userData.name) {
          localStorage.setItem("userName", userData.name);
        }
        if (userData.username) {
          localStorage.setItem("username", userData.username);
        }
        if (userData.email) {
          localStorage.setItem("userEmail", userData.email);
        }
        
        setError(null);
      } else {
        setError(data.message || "Failed to fetch user");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Network error - check if server is running");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user data in state and localStorage
  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedData };
      
      // Update localStorage for other components
      if (updatedData.name) {
        localStorage.setItem("userName", updatedData.name);
      }
      if (updatedData.username) {
        localStorage.setItem("username", updatedData.username);
      }
      if (updatedData.email) {
        localStorage.setItem("userEmail", updatedData.email);
      }
      
      return newUser;
    });
  }, []);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    updateUser,
  };
}