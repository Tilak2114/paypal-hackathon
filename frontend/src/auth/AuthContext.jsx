// frontend/src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockAuthApi } from '../mock/auth';

const AuthContext = createContext(null);

const sanitizeUser = (u) => {
  if (!u) return u;
  const custom = typeof localStorage !== 'undefined' ? localStorage.getItem('user_name') : null;
  if (u.name === 'PayPal Sandbox User' || !u.name) {
    return { ...u, name: custom || 'Aahana Rao' };
  }
  return u;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [paypalPromptOpen, setPaypalPromptOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    mockAuthApi.getMe().then((me) => {
      if (mounted) {
        setUser(sanitizeUser(me));
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // Fetch alerts whenever user changes or on refresh
  const refreshAlerts = async () => {
    try {
      const data = await mockAuthApi.getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error("Failed to load alerts", e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAlerts();
    } else {
      setAlerts([]);
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await mockAuthApi.login(email, password);
    setUser(sanitizeUser(res.user));
    await refreshAlerts();
    return res.user;
  };

  const loginWithPayPal = async () => {
    const res = await mockAuthApi.loginWithPayPal();
    setUser(sanitizeUser(res.user));
    await refreshAlerts();
    return res.user;
  };

  const signup = async (data) => {
    const res = await mockAuthApi.signup(data);
    setUser(sanitizeUser(res.user));
    return res.user;
  };

  const logout = async () => {
    await mockAuthApi.logout();
    setUser(null);
    setAlerts([]);
  };

  const connectPayPal = async (email) => {
    const res = await mockAuthApi.connectPayPal(email);
    setUser({ ...res.user });
    setPaypalPromptOpen(false);
    return res.user;
  };

  const disconnectPayPal = async () => {
    const res = await mockAuthApi.disconnectPayPal();
    setUser({ ...res.user });
    return res.user;
  };

  const syncPayPal = async () => {
    const res = await mockAuthApi.syncPayPal();
    setUser((prev) => prev ? { ...prev, lastSyncAt: res.lastSyncAt } : prev);
    await refreshAlerts();
    return res;
  };

  const markAlertRead = async (id) => {
    await mockAuthApi.markAlertRead(id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  };

  const dismissAlert = async (id) => {
    await mockAuthApi.dismissAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const unreadAlertCount = alerts.filter((a) => !a.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        alerts,
        unreadAlertCount,
        login,
        loginWithPayPal,
        signup,
        logout,
        connectPayPal,
        disconnectPayPal,
        syncPayPal,
        refreshAlerts,
        markAlertRead,
        dismissAlert,
        paypalPromptOpen,
        setPaypalPromptOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
