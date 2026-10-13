/**
 * API 客户端
 * 封装 fetch，自动注入 Bearer Token，401 自动刷新（mutex 模式）
 * 后端响应格式：{ success, statusCode, message, data, timestamp }
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  timestamp?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/** 从 cookie 读取 access token（客户端；SSE fetch stream 等场景直接取用） */
export function getAccessToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/** 从 cookie 读取 refresh token（客户端） */
function getRefreshToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)refreshToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/** 刷新 access token（mutex 防并发） */
/** 刷新 access token（mutex 防并发；ai-api 等直连 fetch 场景复用） */
export async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const result: ApiResponse<{ accessToken: string; refreshToken?: string }> = await res.json();
      if (!result.data?.accessToken) return false;

      // 通过 API Route 设置 cookie（服务端设置 httpOnly cookie）
      await fetch('/api/auth/set-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      });

      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** 通用请求 */
async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const isAuthRequest = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    if (isAuthRequest) {
      const errorBody = await res.json().catch(() => ({ message: '认证失败' }));
      throw errorBody;
    }

    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      const retryRes = await fetch(`${API_BASE}/api${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...options.headers,
        },
      });
      if (!retryRes.ok) {
        const errorBody = await retryRes.json().catch(() => ({ message: '请求失败' }));
        throw errorBody;
      }
      return retryRes.json();
    }

    // 刷新失败，清除 cookie
    await fetch('/api/auth/clear-cookies', { method: 'POST' });
    throw { message: '登录已过期，请重新登录' };
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: `请求失败 (${res.status})` }));
    throw errorBody;
  }

  return res.json();
}

export const apiClient = {
  get: <T = unknown>(path: string) => request<T>(path),

  post: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),

  put: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),

  delete: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
};
