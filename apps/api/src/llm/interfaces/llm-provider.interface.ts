import type { LlmChatParams, LlmChatResult } from './llm.types';

/**
 * LLM 提供商接口
 *
 * 实现此接口以接入不同的 LLM 提供商（OpenAI、Anthropic、Google 等）。
 * 通过 `LLM_PROVIDER` DI Token 注入全局 Provider。
 *
 * @example 实现自定义提供商
 * ```ts
 * class MyProvider implements LlmProvider {
 *   readonly name = 'my-provider';
 *
 *   async chat(params: LlmChatParams): Promise<LlmChatResult> {
 *     // 自定义实现
 *   }
 *
 *   async *chatStream(params: LlmChatParams): AsyncGenerator<string> {
 *     // 自定义流式实现
 *   }
 * }
 * ```
 */
export interface LlmProvider {
  /** 提供商名称，用于日志和调试 */
  readonly name: string;

  /**
   * 非流式聊天补全
   */
  chat(params: LlmChatParams): Promise<LlmChatResult>;

  /**
   * 流式聊天补全，逐 token yield
   */
  chatStream(params: LlmChatParams): AsyncGenerator<string>;
}
