/**
 * HTTP 请求工具
 * 基于 uni.request 封装
 */

import type { ApiConfig } from '@/config/api';
import { API_CONFIG } from '@/config/api';
import { hideLoading, showLoading } from '@/stores/loading';

interface RequestConfig {
  url: string;
  method?: UniApp.RequestOptions['method'];
  data?: UniApp.RequestOptions['data'];
  header?: Record<string, string>;
  timeout?: number;
  /** 是否显示 loading，默认 true */
  showLoading?: boolean;
  /** loading 文案 */
  loadingText?: string;
}

interface Response<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  total?: number; // 总记录数（用于分页）
  page?: number; // 当前页码
  pageSize?: number; // 每页大小
  totalPages?: number; // 总页数
}

class HttpClient {
  private config: ApiConfig;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.config = API_CONFIG;
  }

  /**
   * 获取 token
   */
  private getToken(): string {
    return uni.getStorageSync('token') || '';
  }

  /**
   * 获取 refresh token
   */
  private getRefreshToken(): string {
    return uni.getStorageSync('refreshToken') || '';
  }

  /**
   * 刷新 access token（使用 mutex 防止并发刷新）
   */
  private async refreshAccessToken(): Promise<boolean> {
    // 如果已经在刷新，等待现有刷新完成
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        console.log('[HTTP] 开始刷新 token, refreshToken:', `${refreshToken?.substring(0, 10)}...`);

        if (!refreshToken) {
          console.log('[HTTP] 没有 refreshToken，无法刷新');
          return false;
        }

        // 调用后端刷新接口（REST API）
        const response = await uni.request({
          url: `${this.config.baseURL}/auth/refresh`,
          method: 'POST',
          data: { refreshToken },
          header: { 'Content-Type': 'application/json' },
        });

        console.log('[HTTP] Refresh 响应状态:', response.statusCode);

        if (response.statusCode !== 200) {
          console.log('[HTTP] Refresh 请求失败');
          return false;
        }

        const result = response.data as any;
        console.log('[HTTP] Refresh 响应数据:', result);

        if (!result?.accessToken) {
          console.log('[HTTP] Refresh 响应中没有 accessToken');
          return false;
        }

        // 更新本地存储
        uni.setStorageSync('token', result.accessToken);
        if (result.refreshToken) {
          uni.setStorageSync('refreshToken', result.refreshToken);
        }

        console.log('[HTTP] Token 刷新成功');
        return true;
      } catch (error) {
        console.error('[HTTP] Token 刷新异常:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * 通用请求方法
   */
  private request<T = unknown>(config: RequestConfig): Promise<Response<T>> {
    const {
      url,
      method = 'GET',
      data,
      header = {},
      timeout,
      showLoading: shouldShowLoading = true,
      loadingText = '加载中...',
    } = config;

    // ✅ 显示 loading（如果启用）
    if (shouldShowLoading) {
      showLoading(loadingText);
    }

    return new Promise((resolve, reject) => {
      uni.request({
        url: this.config.baseURL + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          Authorization: this.getToken() ? `Bearer ${this.getToken()}` : '',
          ...header,
        },
        timeout: timeout || this.config.timeout,
        success: (res) => {
          // ✅ 处理 401 未授权错误（自动刷新 token）
          if (res.statusCode === 401) {
            // 判断是否是登录相关请求，如果是则不触发刷新
            const isLoginRequest =
              url.includes('/auth/login') ||
              url.includes('/auth/register') ||
              url.includes('/auth/wechat/login');

            if (isLoginRequest) {
              // 登录请求失败，直接拒绝
              if (shouldShowLoading) {
                hideLoading();
              }
              reject(res.data);
              return;
            }

            // 尝试刷新 token
            this.refreshAccessToken().then((refreshed) => {
              if (refreshed) {
                // Token 刷新成功，重试原始请求
                console.log('[HTTP] 使用新 token 重试请求');
                const newToken = this.getToken();
                uni.request({
                  url: this.config.baseURL + url,
                  method,
                  data,
                  header: {
                    'Content-Type': 'application/json',
                    Authorization: newToken ? `Bearer ${newToken}` : '',
                    ...header,
                  },
                  timeout: timeout || this.config.timeout,
                  success: (retryRes) => {
                    if (shouldShowLoading) {
                      hideLoading();
                    }
                    if (retryRes.statusCode >= 200 && retryRes.statusCode < 300) {
                      const retryResponse = retryRes.data as Response<T>;
                      if (retryResponse.success !== false) {
                        resolve(retryResponse);
                      } else {
                        reject(retryResponse);
                      }
                    } else {
                      reject(retryRes.data);
                    }
                  },
                  fail: (err) => {
                    if (shouldShowLoading) {
                      hideLoading();
                    }
                    uni.showToast({
                      title: '请求重试失败',
                      icon: 'none',
                    });
                    reject(err);
                  },
                });
              } else {
                // Token 刷新失败，清除登录状态
                console.log('[HTTP] Token 刷新失败，清除登录状态');
                uni.removeStorageSync('token');
                uni.removeStorageSync('refreshToken');
                uni.removeStorageSync('userInfo');

                if (shouldShowLoading) {
                  hideLoading();
                }

                // 跳转到登录页（如果需要）
                // uni.navigateTo({ url: '/pages/login/login' })

                reject(res.data);
              }
            });
            return;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = res.data as Response<T>;
            if (response.success !== false) {
              // ✅ 隐藏 loading
              if (shouldShowLoading) {
                hideLoading();
              }
              resolve(response);
            } else {
              // ✅ 隐藏 loading
              if (shouldShowLoading) {
                hideLoading();
              }
              // ❌ 移除自动 showToast，让页面自己处理
              reject(response);
            }
          } else {
            // ✅ 隐藏 loading
            if (shouldShowLoading) {
              hideLoading();
            }
            // ❌ 移除自动 showToast，让页面自己处理业务错误
            reject(res.data);
          }
        },
        fail: (err) => {
          // ✅ 隐藏 loading
          if (shouldShowLoading) {
            hideLoading();
          }
          uni.showToast({
            title: '网络请求失败',
            icon: 'none',
          });
          reject(err);
        },
      });
    });
  }

  /**
   * GET 请求
   */
  get<T = unknown>(
    url: string,
    data?: UniApp.RequestOptions['data'],
    config?: Partial<RequestConfig>,
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'GET', data, ...config });
  }

  /**
   * POST 请求
   */
  post<T = unknown>(
    url: string,
    data?: UniApp.RequestOptions['data'],
    config?: Partial<RequestConfig>,
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'POST', data, ...config });
  }

  /**
   * PUT 请求
   */
  put<T = unknown>(
    url: string,
    data?: UniApp.RequestOptions['data'],
    config?: Partial<RequestConfig>,
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...config });
  }

  /**
   * DELETE 请求
   */
  delete<T = unknown>(
    url: string,
    data?: UniApp.RequestOptions['data'],
    config?: Partial<RequestConfig>,
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'DELETE', data, ...config });
  }
}

export const http = new HttpClient();
export default http;
