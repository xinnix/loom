import type { AppRouter } from '../../types/api';
import { createTRPCProxyClient, httpLink } from '@trpc/client';

// Token refresh state (mutex to prevent concurrent refresh calls)
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Flag to prevent double redirect
let isRedirecting = false;

/**
 * Refresh the access token using the refresh token.
 * Uses mutex pattern to prevent concurrent refresh calls.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    console.log('[tRPC] 等待已有的 refresh 请求完成');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      console.log('[tRPC] 开始刷新 token, refreshToken:', refreshToken?.substring(0, 10) + '...');

      if (!refreshToken) {
        console.log('[tRPC] 没有 refreshToken，无法刷新');
        return false;
      }

      // tRPC v11 HTTP call format: POST to /trpc/auth.refreshToken
      // with JSON body containing the input
      const response = await globalThis.fetch('/trpc/auth.refreshToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      });

      console.log('[tRPC] Refresh 响应状态:', response.status);

      if (!response.ok) {
        console.log('[tRPC] Refresh 请求失败');
        return false;
      }

      const result = await response.json();
      console.log('[tRPC] Refresh 响应数据:', result);

      // tRPC response format: { result: { data: { accessToken, refreshToken } } }
      const resultData = result?.result?.data;
      if (!resultData?.accessToken) {
        console.log('[tRPC] Refresh 响应中没有 accessToken');
        return false;
      }

      localStorage.setItem('accessToken', resultData.accessToken);
      if (resultData.refreshToken) {
        localStorage.setItem('refreshToken', resultData.refreshToken);
      }

      console.log('[tRPC] Token 刷新成功');
      return true;
    } catch (error) {
      console.error('[tRPC] Token 刷新异常:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Handle session expiration: clear auth data and redirect to session expired page.
 * Uses a flag to prevent double redirect when multiple requests fail simultaneously.
 */
function handleUnauthorized(): void {
  if (isRedirecting) return;
  isRedirecting = true;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/unauthorized';
}

/**
 * Shared tRPC client configuration
 *
 * Environment Configuration:
 * - Development: Uses relative path `/trpc`, proxied by Vite to localhost:3000
 * - Production: Uses relative path `/trpc`, proxied by Nginx to api:3000
 * - See vite.config.ts (dev) and nginx.conf (prod) for proxy configuration
 *
 * This client is used by both dataProvider and authProvider.
 * Includes global 401 handling: automatically refreshes token on 401 responses,
 * and redirects to the session expired page if refresh fails.
 */
export const createTrpcClient = () => {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpLink({
        url: import.meta.env.VITE_API_URL || '/trpc',
        // Headers are fetched on every request, ensuring fresh token is used
        headers: () => {
          const token = localStorage.getItem('accessToken');
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };
        },
        fetch(inputUrl, init) {
          return globalThis.fetch(inputUrl, init).then(async (response) => {
            console.log('[tRPC] 请求:', inputUrl, '状态:', response.status);

            if (response.status === 401) {
              // 🔥 如果是登录相关的请求返回 401，不要触发全局处理
              // 登录失败应该由 authProvider.login 处理，显示错误信息而不是跳转
              const requestUrl = String(inputUrl);
              const isLoginRequest =
                requestUrl.includes('auth.adminLogin') ||
                requestUrl.includes('auth.login') ||
                requestUrl.includes('auth.register') ||
                requestUrl.includes('auth.wechatLogin');

              if (isLoginRequest) {
                console.log('[tRPC] 登录请求返回 401，不触发全局处理');
                return response;
              }

              console.log('[tRPC] 收到 401，尝试刷新 token');

              const refreshed = await refreshAccessToken();
              console.log('[tRPC] Token 刷新结果:', refreshed);

              if (refreshed) {
                // Token refreshed successfully — retry original request with new token
                console.log('[tRPC] 使用新 token 重试请求');
                const newToken = localStorage.getItem('accessToken');
                const headers = { ...((init?.headers as Record<string, string>) || {}) };
                if (newToken) {
                  headers['Authorization'] = `Bearer ${newToken}`;
                }
                return globalThis.fetch(inputUrl, { ...init, headers });
              }
              // Refresh failed — redirect to session expired page
              console.log('[tRPC] Token 刷新失败，跳转到登录已过期页面');
              handleUnauthorized();
            }
            return response;
          });
        },
      }),
    ],
  });
};

// Singleton instance
let clientInstance: ReturnType<typeof createTrpcClient> | null = null;

/**
 * Get the shared tRPC client
 * Note: The client uses dynamic headers, so the same instance can be used
 * even after token refresh.
 */
export const getTrpcClient = () => {
  if (!clientInstance) {
    clientInstance = createTrpcClient();
  }
  return clientInstance;
};

/**
 * Reset the client instance (useful after logout or major auth changes)
 */
export const resetTrpcClient = () => {
  clientInstance = null;
};
