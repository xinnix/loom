/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authProvider } from './authProvider';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isInitialized = useRef(false);

  // Check auth function - use ref to track initialization
  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous calls using ref only
    if (isInitialized.current) {
      return;
    }

    try {
      const identity = await authProvider.getIdentity?.();
      setUser(identity);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
      isInitialized.current = true;
    }
  }, []); // Empty deps - function is stable

  useEffect(() => {
    // checkAuth 内 setState 均在 await 之后，属合法的挂载期异步初始化；
    // react-hooks 新规则不跨 async 边界分析，此处为误报。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, []); // Run once on mount

  const login = useCallback(async (username: string, password: string) => {
    const result = await authProvider.login({ username, password });

    // Check if login failed
    if (!result.success) {
      const errorMessage = result.error?.message || '登录失败';
      console.error('AuthContext: 登录失败 -', errorMessage);
      throw new Error(errorMessage);
    }

    // Wait a brief moment to ensure localStorage is fully updated
    // This prevents race conditions when fetching identity immediately after login
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update state directly
    const identity = await authProvider.getIdentity?.();
    setUser(identity);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Get refresh token from localStorage
      const refreshToken = localStorage.getItem('refreshToken');

      // Call backend logout API to revoke refresh token
      if (refreshToken) {
        await authProvider.logout?.({ refreshToken });
      } else {
        // If no refresh token, just clear local storage
        await authProvider.logout?.({});
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
    } finally {
      // Clear local state
      setIsAuthenticated(false);
      setUser(null);
      isInitialized.current = false;
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
