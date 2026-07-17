import { Injectable, Logger, Inject } from '@nestjs/common';
import { LLM_CONFIG, LLM_PROVIDER } from './llm.constants';
import type { LlmProvider } from './interfaces/llm-provider.interface';
import type { LlmConfig } from './interfaces/llm.types';
import type { LlmChatParams, LlmChatResult } from './interfaces/llm.types';

/**
 * LlmService — 框架级 LLM 抽象服务
 *
 * 对所有模块提供统一的 LLM 调用能力，支持流式/非流式输出。
 * 通过 NestJS DI 注入，内部使用配置的 LlmProvider 实现。
 *
 * @example 在模块中使用
 * ```ts
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly llm: LlmService) {}
 *
 *   async ask(question: string) {
 *     return this.llm.chat({
 *       messages: [
 *         { role: 'system', content: '你是一位助手。' },
 *         { role: 'user', content: question },
 *       ],
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly provider: LlmProvider,
    @Inject(LLM_CONFIG) private readonly config: LlmConfig,
  ) {}

  /**
   * 非流式聊天补全
   *
   * @param params 聊天参数（model 可选，未传则使用全局默认模型）
   * @returns 完整的聊天响应内容
   */
  async chat(params: LlmChatParams): Promise<LlmChatResult> {
    const merged: LlmChatParams = {
      ...params,
      model: params.model || this.config.model,
    };

    this.logger.debug(`LLM chat: model=${merged.model}, messages=${merged.messages.length}`);

    try {
      const result = await this.provider.chat(merged);
      return result;
    } catch (error) {
      this.logger.error(`LLM chat failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 流式聊天补全
   *
   * 逐 token 返回生成内容，适用于 SSE 或实时展示场景。
   *
   * @param params 聊天参数（model 可选，未传则使用全局默认模型）
   * @yields 每个 token 的内容片段
   */
  async *chatStream(params: LlmChatParams): AsyncGenerator<string> {
    const merged: LlmChatParams = {
      ...params,
      model: params.model || this.config.model,
    };

    this.logger.debug(`LLM chatStream: model=${merged.model}, messages=${merged.messages.length}`);

    try {
      yield* this.provider.chatStream(merged);
    } catch (error) {
      this.logger.error(`LLM chatStream failed: ${(error as Error).message}`);
      throw error;
    }
  }
}
