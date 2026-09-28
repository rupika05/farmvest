import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'farmvest_token_v3';
const USER_KEY  = 'farmvest_user_v3';

// Normalize role: treat 'retailer' as 'merchant' in frontend
function normalizeRole(role) {
  if (role === 'retailer') return 'merchant';
  return role;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (!saved) return null;
      const user = JSON.parse(saved);
      return { ...user, role: normalizeRole(user.role) };
    } catch { return null; }
  });
  const [activeView, setActiveView] = useState(() => currentUser ? 'dashboard' : 'landing');
  const [authTargetRole, setAuthTargetRole] = useState('farmer');
  const [loading, setLoading] = useState(false);

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
    // Map merchant → merchant (server accepts merchant now)
    const serverRole = userData.role === 'merchant' ? 'merchant' : userData.role;
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, role: serverRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Registration failed.' };
      }
      const user = { ...data.user, role: normalizeRole(data.user.role) };
      setToken(data.token);
      setCurrentUser(user);
      setActiveView('dashboard');
      return { success: true, user };
    } catch (err) {
      return { success: false, error: 'Cannot reach server. Please make sure the backend is running.' };
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const login = async (email, password, role) => {
    setLoading(true);
    // Accept merchant login even if stored as retailer on server
    const serverRole = role === 'merchant' ? undefined : role; // send undefined so server doesn't reject merchant→retailer
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: serverRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Login failed.' };
      }
      const user = { ...data.user, role: normalizeRole(data.user.role) };
      setToken(data.token);
      setCurrentUser(user);
      setActiveView('dashboard');
      return { success: true, user };
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
