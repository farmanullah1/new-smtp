import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../api/user';
import { logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('accessToken')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await getProfile();
      if (res && res.user) {
        setUser(res.user);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (tokens, userData) => {
    if (tokens?.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
      setToken(tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    if (userData) {
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        updateUser,
        refreshProfile: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
