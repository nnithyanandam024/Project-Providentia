import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:8000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('providentia_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('providentia_token') || null;
  });

  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('providentia_token', token);
    } else {
      localStorage.removeItem('providentia_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('providentia_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('providentia_user');
    }
  }, [user]);

  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Authentication failed');
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginDemo = (demoUser, demoToken = 'demo_jwt_token_2026') => {
    setUser(demoUser);
    setToken(demoToken);
    setAuthError(null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('providentia_token');
    localStorage.removeItem('providentia_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        authError,
        login,
        loginDemo,
        logout
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
