import { Injectable, Logger } from '@nestjs/common';
import type {
  AssistantMessage,
  AssistantMessageEventStream,
  Context as PiContext,
  Message,
  Tool,
} from '@earendil-works/pi-ai';
import { ErrorCodes } from '../../core/exceptions';
import { BusinessException } from '../../core/exceptions/business.exception';
import { LlmConfigService } from './llm-config.service';
import { buildPiModel } from './pi-model.factory';
import type { LlmConfigResolved } from './interfaces';

/** 门面调用参数（pi 消息/工具类型直通，见 interfaces.ts 说明） */
export interface LlmChatParams {
  systemPrompt?: string;
  messages: Message[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export type LlmEventStream = AssistantMessageEventStream;

/**
 * AI 第 1 层：LLM 调用门面（pi 底座）。
 *
 * - `chat` / `chatStream`：默认配置（DB isDefault → env 兜底），供框架内部零散使用
 * - `chatWith` / `chatStreamWith`：按解析后的 LlmConfig 调用，Agent 运行时使用
 *
 * 超时与重试由 pi 的 StreamOptions（timeoutMs/maxRetries）承担，值来自 LlmConfig 行。
 * 日志脱敏：只记 configKey 与模型名，任何路径不落 apiKey。
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly llmConfig: LlmConfigService) {}

  /** 非流式调用（loop 节点 / 后台任务） */
  async chat(params: LlmChatParams): Promise<AssistantMessage> {
    const resolved = await this.llmConfig.resolveDefault();
    return this.chatWith(resolved, params);
  }

  /** 流式调用（chat 节点 / Playground），返回 pi 事件流（AsyncIterable） */
  chatStream(params: LlmChatParams): Promise<LlmEventStream> {
    return this.llmConfig
      .resolveDefault()
      .then((resolved) => this.chatStreamWith(resolved, params));
  }

  async chatWith(resolved: LlmConfigResolved, params: LlmChatParams): Promise<AssistantMessage> {
    const { models, model } = await buildPiModel(resolved);
    const context = this.toContext(params);
    const message = await models.complete(model, context, {
      temperature: params.temperature ?? resolved.temperature,
      maxTokens: params.maxTokens ?? resolved.maxTokens,
      signal: params.signal,
    });
    this.assertOk(message, resolved.configKey);
    return message;
  }

  async chatStreamWith(
    resolved: LlmConfigResolved,
    params: LlmChatParams,
  ): Promise<LlmEventStream> {
    const { models, model } = await buildPiModel(resolved);
    this.logger.log(`llm stream configKey=${resolved.configKey} model=${resolved.model}`);
    return models.stream(model, this.toContext(params), {
      temperature: params.temperature ?? resolved.temperature,
      maxTokens: params.maxTokens ?? resolved.maxTokens,
      signal: params.signal,
    });
  }

  /** 校验完成消息：provider 错误（stopReason=error）转为业务错误，errorMessage 不含原始响应体 */
  assertOk(message: AssistantMessage, configKey: string): void {
    if (message.stopReason === 'error' || message.stopReason === 'aborted') {
      if (message.stopReason === 'aborted') {
        throw new BusinessException({
          message: 'LLM 调用被中止',
          errorCode: ErrorCodes.AI_TOOL_EXEC_FAILED,
          statusCode: 499,
          details: { configKey },
        });
      }
      throw new BusinessException({
        message: `LLM 调用失败（configKey=${configKey}）：${message.errorMessage ?? '未知错误'}`,
        errorCode: ErrorCodes.AI_TOOL_EXEC_FAILED,
        statusCode: 502,
        details: { configKey },
      });
    }
  }

  private toContext(params: LlmChatParams): PiContext {
    return {
      systemPrompt: params.systemPrompt,
      messages: params.messages,
      tools: params.tools,
    };
  }
}
