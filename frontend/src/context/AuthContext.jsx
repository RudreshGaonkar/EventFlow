import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile', {
          signal: controller.signal,
          timeout: 10000,
        });
        setUser(res.data.data);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setUser(null);
      }

      setLoading(false);
    };

    fetchProfile();
    return () => { controller.abort(); };
  }, []);

  const login  = (userData) => setUser(userData);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (role) => {
    const userRoles = user?.roles || (user?.role_name ? [user.role_name] : []);
    return userRoles.includes(role);
  };

  const isRole = (role) => hasRole(role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};