/**
 * AI Agent 用户端 API（ADR-006）：
 * 会话 CRUD 走 apiClient 信封契约；run 为 SSE 流式（EventSource 不支持
 * 自定义 Authorization header，用 fetch stream 解析）。
 */
import { apiClient, getAccessToken, refreshAccessToken, type ApiResponse } from './api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface AgentInfo {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface AgentSession {
  id: string;
  agentSlug: string;
  title?: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface AgentMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  runId?: string | null;
  createdAt: string;
}

/** SSE 事件（api 端 RunEvent 同构，仅聊天页用到的字段） */
export interface RunEvent {
  type:
    | 'run_start'
    | 'node_start'
    | 'content'
    | 'tool_call'
    | 'tool_result'
    | 'node_end'
    | 'run_end'
    | 'error';
  runId?: string;
  nodeId?: string;
  text?: string;
  output?: string;
  message?: string;
}

export const aiApi = {
  listAgents: () => apiClient.get<AgentInfo[]>('/ai/agents'),

  createSession: (agentSlug: string) => apiClient.post<AgentSession>('/ai/sessions', { agentSlug }),

  listSessions: (agentSlug?: string) =>
    apiClient.get<AgentSession[]>(
      `/ai/sessions${agentSlug ? `?agentSlug=${encodeURIComponent(agentSlug)}` : ''}`,
    ),

  getSession: (id: string) =>
    apiClient.get<AgentSession & { messages: AgentMessageItem[] }>(`/ai/sessions/${id}`),

  deleteSession: (id: string) => apiClient.delete(`/ai/sessions/${id}`),
};

/**
 * 流式运行 agent（POST /ai/agents/:slug/run，SSE）。
 * 逐事件回调 onEvent；服务端 run 失败经 error 事件 + 连接关闭传达。
 * 401 时刷新 token 重试一次（与 apiClient.request 同模式）。
 */
export async function runAgentStream(params: {
  slug: string;
  input?: Record<string, unknown>;
  sessionId?: string;
  onEvent: (event: RunEvent) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { slug, input, sessionId, onEvent, signal } = params;

  const doFetch = () =>
    fetch(`${API_BASE}/api/ai/agents/${encodeURIComponent(slug)}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ ...(input ? { input } : {}), ...(sessionId ? { sessionId } : {}) }),
      signal,
    });

  let res = await doFetch();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken().catch(() => false);
    if (refreshed) res = await doFetch();
  }

  if (!res.ok || !res.body) {
    const errorBody = await res.json().catch(() => ({ message: `请求失败 (${res.status})` }));
    throw errorBody;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // SSE 按 \n\n 分帧，每帧 data: {json}
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of frame.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          onEvent(JSON.parse(payload) as RunEvent);
        } catch {
          // 跳过无法解析的帧
        }
      }
    }
  }
}

/** run 错误的统一消息提取（信封错误体或 Error） */
export function aiErrorMessage(err: unknown): string {
  const e = err as { message?: string };
  return e?.message || '请求失败';
}

export type { ApiResponse };
