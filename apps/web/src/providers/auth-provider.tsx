'use client';

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@loom/shared';
import {
  login as authLogin,
  logout as authLogout,
  getCurrentUser,
  register as authRegister,
} from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      await authLogin(username, password);
      await refreshUser();
    },
    [refreshUser],
  );

  const register = useCallback(
    async (data: { username: string; email: string; password: string }) => {
      await authRegister(data);
      await refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
