/**
 * Agent 相关 API
 *
 * 注：Agent 流式聊天功能已移至 LLM 抽象层（LlmService），
 * 小程序端可直接调用 REST 端点 /agents/:id/chat 获取 SSE 流。
 */
import { http } from '@/utils/http';
import { API_ENDPOINTS } from '@/config/api';

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider: string;
  sort: number;
}

export const agentsApi = {
  /** 获取已激活的 Agent 列表 */
  getActiveAgents: () => http.get<Agent[]>(API_ENDPOINTS.agentsActive),
};
