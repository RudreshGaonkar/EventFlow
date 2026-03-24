import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setLoading(false);
    }, 3000);

    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile', { signal: controller.signal });
        setUser(res.data.data);
      } catch {
        setUser(null);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    fetchProfile();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  const login  = (userData) => setUser(userData);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    window.location.href = '/login';
  };

  const isRole = (role) => user?.role_name === role;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
