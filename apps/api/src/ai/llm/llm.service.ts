import { Injectable, Logger, Optional } from '@nestjs/common';
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
import {
  LlmTraceService,
  classifyLlmError,
  traceLlmStream,
  type LlmCallLogDraft,
  type LlmTraceMeta,
} from '../llm-trace/llm-trace.service';
import type { LlmConfigResolved } from './interfaces';

/** 门面调用参数（pi 消息/工具类型直通，见 interfaces.ts 说明） */
export interface LlmChatParams {
  systemPrompt?: string;
  messages: Message[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  /** 用量流水归因（ADR-007）：缺省不埋点（埋点零行为改变） */
  trace?: LlmTraceMeta;
}

export type LlmEventStream = AssistantMessageEventStream;

function messagesChars(messages: Message[], systemPrompt?: string): number {
  let n = systemPrompt?.length ?? 0;
  for (const m of messages) {
    n += typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length;
  }
  return n;
}

/**
 * AI 第 1 层：LLM 调用门面（pi 底座）。
 *
 * - `chat` / `chatStream`：默认配置（DB isDefault → env 兜底），供框架内部零散使用
 * - `chatWith` / `chatStreamWith`：按解析后的 LlmConfig 调用，Agent 运行时使用
 *
 * 超时与重试由 pi 的 StreamOptions（timeoutMs/maxRetries）承担，值来自 LlmConfig 行。
 * 日志脱敏：只记 configKey 与模型名，任何路径不落 apiKey。
 * 用量埋点（ADR-007）：params.trace 提供归因时旁听一次调用并落 LlmCallLog；
 * trace 服务缺省（单测直 new）或未传 meta 时不产生任何行为差异。
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly llmConfig: LlmConfigService,
    @Optional() private readonly trace?: LlmTraceService,
  ) {}

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
    const started = Date.now();
    try {
      const message = await models.complete(model, context, {
        temperature: params.temperature ?? resolved.temperature,
        maxTokens: params.maxTokens ?? resolved.maxTokens,
        signal: params.signal,
      });
      this.traceFromMessage(resolved, params, message, started);
      this.assertOk(message, resolved.configKey);
      return message;
    } catch (err) {
      // assertOk 抛出的业务异常已在 traceFromMessage 记过（message 自带错误终态）
      if (!(err instanceof BusinessException)) {
        this.traceError(resolved, params, err, started);
      }
      throw err;
    }
  }

  async chatStreamWith(
    resolved: LlmConfigResolved,
    params: LlmChatParams,
  ): Promise<LlmEventStream> {
    const { models, model } = await buildPiModel(resolved);
    this.logger.log(`llm stream configKey=${resolved.configKey} model=${resolved.model}`);
    const stream = models.stream(model, this.toContext(params), {
      temperature: params.temperature ?? resolved.temperature,
      maxTokens: params.maxTokens ?? resolved.maxTokens,
      signal: params.signal,
    });
    if (this.trace && params.trace) {
      traceLlmStream(
        stream,
        {
          ...params.trace,
          llmConfigId: resolved.id ?? null,
          callType: 'CHAT_STREAM',
          model: resolved.model,
          promptChars: messagesChars(params.messages, params.systemPrompt),
          temperature: params.temperature ?? resolved.temperature ?? null,
          maxTokens: params.maxTokens ?? resolved.maxTokens ?? null,
        },
        (draft) => this.trace?.record(draft),
      );
    }
    return stream;
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

  private traceFromMessage(
    resolved: LlmConfigResolved,
    params: LlmChatParams,
    message: AssistantMessage,
    started: number,
  ): void {
    if (!this.trace || !params.trace) return;
    const status =
      message.stopReason === 'error'
        ? 'ERROR'
        : message.stopReason === 'aborted'
          ? 'ABORTED'
          : 'SUCCESS';
    const draft: LlmCallLogDraft = {
      ...params.trace,
      llmConfigId: resolved.id ?? null,
      callType: 'CHAT',
      model: resolved.model,
      status,
      inputTokens: message.usage?.input ?? null,
      outputTokens: message.usage?.output ?? null,
      promptChars: messagesChars(params.messages, params.systemPrompt),
      latencyMs: message.durationMs ?? Date.now() - started,
      errorClass: status === 'ERROR' ? 'unknown' : null,
      errorMsg:
        status === 'ERROR' ? String(message.errorMessage ?? '').slice(0, 200) || null : null,
      temperature: params.temperature ?? resolved.temperature ?? null,
      maxTokens: params.maxTokens ?? resolved.maxTokens ?? null,
    };
    this.trace.record(draft);
  }

  private traceError(
    resolved: LlmConfigResolved,
    params: LlmChatParams,
    err: unknown,
    started: number,
  ): void {
    if (!this.trace || !params.trace) return;
    this.trace.record({
      ...params.trace,
      llmConfigId: resolved.id ?? null,
      callType: 'CHAT',
      model: resolved.model,
      status: classifyLlmError(err) === 'timeout' ? 'TIMEOUT' : 'ERROR',
      promptChars: messagesChars(params.messages, params.systemPrompt),
      latencyMs: Date.now() - started,
      errorClass: classifyLlmError(err),
      errorMsg: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
  }

  private toContext(params: LlmChatParams): PiContext {
    return {
      systemPrompt: params.systemPrompt,
      messages: params.messages,
      tools: params.tools,
    };
  }
}
