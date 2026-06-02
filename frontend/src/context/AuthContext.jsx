import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/apiClient';

const AuthContext = createContext(null);

function getInitialToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fb_token');
}

function getInitialUser() {
  if (typeof window === 'undefined') return null;
  const savedUser = localStorage.getItem('fb_user');
  return savedUser ? JSON.parse(savedUser) : null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = getInitialToken();
    const savedUser = getInitialUser();

    if (savedToken) {
      api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
      setToken(savedToken);
    }
    if (savedUser) {
      setUser(savedUser);
    }

    async function loadCurrentUser() {
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        localStorage.setItem('fb_user', JSON.stringify(response.data.user));
      } catch (err) {
        localStorage.removeItem('fb_token');
        localStorage.removeItem('fb_user');
        delete api.defaults.headers.common.Authorization;
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, [token]);

  const login = ({ token: newToken, user: newUser }) => {
    localStorage.setItem('fb_token', newToken);
    localStorage.setItem('fb_user', JSON.stringify(newUser));
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('fb_token');
    localStorage.removeItem('fb_user');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
