/**
 * API 配置
 * 根据环境自动选择 API 基础 URL
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
}

// 从环境变量获取 API 地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 配置
export const API_CONFIG: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};

// API 端点 - genModule 生成的模块会自动追加到此对象
export const API_ENDPOINTS = {
  // 用户相关
  login: '/auth/login',
  logout: '/auth/logout',
  register: '/auth/register',
  profile: '/auth/me',
  refresh: '/auth/refresh',
  wechatLogin: '/auth/wechat/login',

  // TODO 相关（示例模块）
  todos: '/todos',
  todoDetail: (id: string) => `/todos/${id}`,

  // Agent 相关
  agentsActive: '/agents/active',
  agentChat: (id: string) => `/agents/${id}/user-chat`,
  agentConversations: (id: string) => `/agents/${id}/conversations`,
  agentMessages: (id: string, conversationId: string) => `/agents/${id}/messages/${conversationId}`,
} as const;

export default API_CONFIG;
