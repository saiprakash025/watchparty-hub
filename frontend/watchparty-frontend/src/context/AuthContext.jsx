import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('wph_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() =>
    sessionStorage.getItem('wph_token')
  );

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    setUser(data.user);
    setToken(data.token);
    sessionStorage.setItem('wph_user', JSON.stringify(data.user));
    sessionStorage.setItem('wph_token', data.token);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setUser(data.user);
    setToken(data.token);
    sessionStorage.setItem('wph_user', JSON.stringify(data.user));
    sessionStorage.setItem('wph_token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('wph_user');
    sessionStorage.removeItem('wph_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
