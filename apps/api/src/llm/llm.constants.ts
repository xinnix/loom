import type { LlmConfig } from './interfaces/llm.types';

/** LlmModule 配置注入 Token */
export const LLM_CONFIG = Symbol('LLM_CONFIG');

/** LlmProvider 实现注入 Token */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

/**
 * 从环境变量读取默认 LLM 配置
 */
export function loadLlmConfigFromEnv(overrides?: Partial<LlmConfig>): LlmConfig {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error(
      'LLM_API_KEY 环境变量未配置。请在 .env 文件中设置 LLM_API_KEY，或在 LlmModule.forRoot() 中传入 apiKey。',
    );
  }

  return {
    apiUrl: process.env.LLM_API_URL || 'https://api.openai.com/v1',
    apiKey,
    model: process.env.LLM_MODEL || 'gpt-4o',
    ...overrides,
  };
}
