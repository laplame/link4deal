import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../services/authApi';
import type { AuthUser, LoginCredentials, PrimaryRole, RegisterData } from '../types/auth';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_REFRESH_KEY = 'auth_refresh_token';
const AUTH_USER_KEY = 'auth_user';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  primaryRole: PrimaryRole | null;
  hasRole: (role: PrimaryRole) => boolean;
  hasAnyRole: (roles: PrimaryRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistAuth = useCallback((newToken: string, refreshToken: string, userData: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loadUserFromStorage = useCallback(async () => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    const refresh = localStorage.getItem(AUTH_REFRESH_KEY);

    if (!storedToken || !storedUser) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      persistAuth(storedToken, refresh || '', data.user);
    } catch {
      try {
        if (refresh) {
          const refreshed = await authApi.refreshToken(refresh);
          persistAuth(refreshed.token, refreshed.refreshToken, JSON.parse(storedUser));
          return;
        }
      } catch {
        // ignore
      }
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth, persistAuth]);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setError(null);
      const data = await authApi.login(credentials);
      persistAuth(data.token, data.refreshToken, data.user);
    },
    [persistAuth]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      setError(null);
      const res = await authApi.register(data);
      persistAuth(res.token, res.refreshToken, res.user);
    },
    [persistAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const clearError = useCallback(() => setError(null), []);

  const primaryRole: PrimaryRole | null = user?.primaryRole ?? null;

  const hasRole = useCallback(
    (role: PrimaryRole) => Boolean(user?.primaryRole === role),
    [user?.primaryRole]
  );

  const hasAnyRole = useCallback(
    (roles: PrimaryRole[]) => (user?.primaryRole ? roles.includes(user.primaryRole) : false),
    [user?.primaryRole]
  );

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    primaryRole,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Devuelve el token para enviar en cabecera Authorization en peticiones autenticadas */
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
