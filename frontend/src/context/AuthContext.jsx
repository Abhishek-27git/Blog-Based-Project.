import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.data && response.data.success) {
          setUser(response.data.user);
        }
      } catch (err) {
        // Silently fail if not logged in (user will remain null)
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data && response.data.success) {
        setUser(response.data.user);
        return response.data;
      }
    } catch (err) {
      setError(err.message || "Invalid credentials.");
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await api.post("/auth/register", { name, email, password });
      if (response.data && response.data.success) {
        setUser(response.data.user);
        return response.data;
      }
    } catch (err) {
      setError(err.message || "Registration failed.");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed at backend", err);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const updateUserProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUserProfileState,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
