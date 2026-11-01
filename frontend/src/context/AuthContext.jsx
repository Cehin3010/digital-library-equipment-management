import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, logoutCurrentUser, verifyLoginOtp } from '../services/api';

const TOKEN_KEY = 'token';
const USER_KEY = 'digital-library-user';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    getCurrentUser()
      .then((response) => {
        if (!active) return;
        const currentUser = response.data;
        if (!currentUser) throw new Error('API không trả về thông tin tài khoản hiện tại.');
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError?.status === 401) {
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const login = async ({ email, otp }) => {
    const response = await verifyLoginOtp({ email, otp });
    const nextToken = response.data?.token;
    if (!nextToken) {
      throw new Error('Phản hồi đăng nhập không có token. Vui lòng kiểm tra API xác thực.');
    }

    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setIsLoading(true);
    try {
      const currentUser = response.data?.user || (await getCurrentUser()).data;
      if (!currentUser) {
        throw new Error('API không trả về thông tin tài khoản sau khi đăng nhập.');
      }
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      setUser(currentUser);
      setIsLoading(false);
      return currentUser;
    } catch (error) {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) await logoutCurrentUser();
    } finally {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const value = useMemo(() => ({
    token,
    user,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
  }), [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider.');
  }
  return context;
}
