import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('nf_token');
    if (token) {
      api.get('/auth/me').then(res => setUser(res.data.user)).catch(() => localStorage.removeItem('nf_token')).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);
  const login = async (email, password) => { const res = await api.post('/auth/login', { email, password }); localStorage.setItem('nf_token', res.data.token); setUser(res.data.user); return res.data; };
  const signup = async (name, email, password) => { const res = await api.post('/auth/signup', { name, email, password }); localStorage.setItem('nf_token', res.data.token); setUser(res.data.user); return res.data; };
  const logout = () => { localStorage.removeItem('nf_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
