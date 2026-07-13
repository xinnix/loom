/**
 * 认证辅助函数
 * 通过 Next.js API Route 代理后端认证，使用 httpOnly Cookie 存储 Token
 */

import { apiClient } from './api-client';
import type { User } from '@roundtable/shared';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/** 登录 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  // 通过 Next.js API Route 代理，设置 httpOnly cookie
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '登录失败' }));
    throw new Error(error.message || '登录失败');
  }

  const result = await res.json();
  return result.data;
}

/** 注册 */
export async function register(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '注册失败' }));
    throw new Error(error.message || '注册失败');
  }

  const result = await res.json();

  // 注册成功后自动登录（设置 cookie）
  if (result.data?.accessToken) {
    await fetch('/api/auth/set-cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      }),
    });
  }

  return result.data;
}

/** 获取当前用户 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  } catch {
    return null;
  }
}

/** 登出 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    // 无论后端是否成功，都清除 cookie
    await fetch('/api/auth/clear-cookies', { method: 'POST' });
  }
}
