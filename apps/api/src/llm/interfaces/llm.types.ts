import { z } from 'zod';

// ============================================
// LLM Message Types
// ============================================
export type LlmMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
}

// ============================================
// LLM Chat Parameters
// ============================================
export interface LlmChatParams {
  messages: LlmMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
}

// ============================================
// LLM Chat Result
// ============================================
export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmChatResult {
  content: string;
  model: string;
  usage?: LlmUsage;
  finishReason?: string;
}

// ============================================
// LLM Configuration
// ============================================
export interface LlmConfig {
  /** API base URL，如 https://api.openai.com/v1 */
  apiUrl: string;
  /** API Key */
  apiKey: string;
  /** 默认模型名 */
  model: string;
  /** 请求超时（毫秒） */
  timeout?: number;
  /** 最大重试次数（默认为 0 不重试） */
  maxRetries?: number;
}
