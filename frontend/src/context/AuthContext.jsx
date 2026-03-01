import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('opsboard_token');
    const storedUser = localStorage.getItem('opsboard_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        initSocket(token); // Reconnect socket
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('opsboard_token', data.token);
    localStorage.setItem('opsboard_user', JSON.stringify(data.user));
    setUser(data.user);
    initSocket(data.token);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    // Registration no longer returns a token — user must verify email first.
    return data; // { message, email }
  };

  const logout = () => {
    localStorage.removeItem('opsboard_token');
    localStorage.removeItem('opsboard_user');
    disconnectSocket();
    setUser(null);
  };

  // Refresh the stored user object (e.g., after joining a team)
  const refreshUser = async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data);
      localStorage.setItem('opsboard_user', JSON.stringify(data));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
