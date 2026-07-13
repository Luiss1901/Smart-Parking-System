import React, { createContext, useState, useEffect, useContext } from 'react';
import { verifyTokenApi } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount and verify token
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("currentUser");
      const storedToken = localStorage.getItem("token");
      
      if (storedUser && storedToken) {
        try {
          // Verify if token is still valid
          const res = await verifyTokenApi();
          if (res.valid) {
            // Update user from localStorage or use fresh decoded data if needed
            setCurrentUser(JSON.parse(storedUser));
          } else {
            // Invalid token
            localStorage.removeItem("currentUser");
            localStorage.removeItem("token");
          }
        } catch (e) {
          console.error("Token verification failed", e);
          localStorage.removeItem("currentUser");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>Đang tải...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
