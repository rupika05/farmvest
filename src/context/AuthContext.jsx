import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'farmvest_token_v3';
const USER_KEY  = 'farmvest_user_v3';

export function AuthProvider({ children }) {
  // Load persisted user/token from localStorage
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [activeView, setActiveView] = useState(() => currentUser ? 'dashboard' : 'landing');
  const [authTargetRole, setAuthTargetRole] = useState('farmer');
  const [loading, setLoading] = useState(false);

  // Persist token + user whenever they change
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(USER_KEY);
  }, [currentUser]);

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Registration failed.' };
      }
      setToken(data.token);
      setCurrentUser(data.user);
      setActiveView('dashboard');
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'Cannot reach server. Please make sure the backend is running.' };
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Login failed.' };
      }
      setToken(data.token);
      setCurrentUser(data.user);
      setActiveView('dashboard');
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'Cannot reach server. Please make sure the backend is running.' };
    } finally {
      setLoading(false);
    }
  };

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setActiveView('landing');
  };

  const openAuthForRole = (role) => {
    setAuthTargetRole(role);
    setActiveView('auth');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      token,
      activeView,
      setActiveView,
      authTargetRole,
      setAuthTargetRole,
      openAuthForRole,
      login,
      register,
      logout,
      loading,
      API_URL,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
