import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("ncc_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("ncc_profile");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FIX: Use useCallback to avoid stale closure issues with refreshProfile
  const fetchAndCacheProfile = useCallback(async (role) => {
    try {
      const endpoint = role === "admin" ? "/admin/profile" : "/cadet/profile";
      const { data } = await api.get(endpoint);
      localStorage.setItem("ncc_profile", JSON.stringify(data));
      setProfile(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  // On app load, refresh profile if logged in but no cached profile
  useEffect(() => {
    const savedUser = localStorage.getItem("ncc_user");
    const token = localStorage.getItem("ncc_token");
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      // Set auth header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (!localStorage.getItem("ncc_profile")) {
        fetchAndCacheProfile(parsedUser.role);
      }
    }
  }, [fetchAndCacheProfile]);

  const login = async (regimentalNumber, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { regimentalNumber, password });

      localStorage.setItem("ncc_token", data.token);
      localStorage.setItem("ncc_user", JSON.stringify(data.user));
      setUser(data.user);

      // Set auth header immediately so profile fetch works
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      await fetchAndCacheProfile(data.user.role);

      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("ncc_token");
    localStorage.removeItem("ncc_user");
    localStorage.removeItem("ncc_profile");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setProfile(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem("ncc_user", JSON.stringify(updated));
    setUser(updated);
  };

  // Re-fetch and cache profile (called after profile update so Sidebar stays in sync)
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchAndCacheProfile(user.role);
  }, [user, fetchAndCacheProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, logout, updateUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
