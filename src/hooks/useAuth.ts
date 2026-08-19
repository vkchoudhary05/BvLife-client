import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export function useAuth() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('grams_auth_token') || localStorage.getItem('grams_auth_token');
    }
    return null;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync token changes to storage
  const handleLoginSuccess = useCallback((token: string, isUserAdmin = false) => {
    sessionStorage.setItem('grams_auth_token', token);
    if (!isUserAdmin) {
      localStorage.setItem('grams_auth_token', token);
    }
    setAuthToken(token);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('grams_auth_token');
    localStorage.removeItem('grams_auth_token');
    localStorage.removeItem('grams_recent_orders');
    localStorage.removeItem('grams_last_completed_order');
    localStorage.removeItem('grams_last_placed_order');
    setAuthToken(null);
    setCurrentUser(null);
  }, []);

  const handleLogin = async (credentials: { email: string; password?: string }): Promise<boolean> => {
    try {
      const data = await api.login(credentials);
      if (data) {
        const cleanEmail = (data.user?.email || credentials.email).toLowerCase();
        const isUserAdmin = data.user?.role === 'admin' || ['iamvivekbaliyan07@gmail.com', 'vkchoudhary050607@gmail.com', 'admin@gramslife.com', 'care@gramslife.com'].includes(cleanEmail);

        handleLoginSuccess(data.token, isUserAdmin);
        setCurrentUser(data.user);
        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    return false;
  };

  const handleRegister = async (data: { name: string; email: string; phone: string; role: string; password?: string; accessToken?: string; code?: string; reqId?: string }): Promise<boolean> => {
    try {
      const regData = await api.register({
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        password: data.password || 'password123',
        accessToken: data.accessToken,
        code: data.code,
        reqId: data.reqId
      });
      if (regData) {
        const cleanEmail = (regData.user?.email || data.email).toLowerCase();
        const isUserAdmin = regData.user?.role === 'admin' || ['iamvivekbaliyan07@gmail.com', 'vkchoudhary050607@gmail.com', 'admin@gramslife.com', 'care@gramslife.com'].includes(cleanEmail);

        handleLoginSuccess(regData.token, isUserAdmin);
        setCurrentUser(regData.user);
        return true;
      }
    } catch (err) {
      console.error('Register error:', err);
    }
    return false;
  };

  // Check auth user status
  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null);
      return;
    }

    api.getUserMe(authToken).then((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        sessionStorage.removeItem('grams_auth_token');
        localStorage.removeItem('grams_auth_token');
        setAuthToken(null);
        setCurrentUser(null);
      }
    }).catch(() => {
      setAuthToken(null);
      setCurrentUser(null);
    });
  }, [authToken]);

  return {
    authToken,
    setAuthToken,
    currentUser,
    setCurrentUser,
    handleLogin,
    handleRegister,
    handleLogout,
    handleLoginSuccess
  };
}
