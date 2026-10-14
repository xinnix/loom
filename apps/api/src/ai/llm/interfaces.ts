/**
 * AI 第 1 层：LLM 调用抽象的内部类型。
 *
 * 底座为 pi（@earendil-works/pi-ai）：消息/事件/工具类型直接复用 pi 的
 * Context、AssistantMessageEvent、Tool，本目录只补充配置解析相关的薄类型。
 */
import type { Models, Model, Usage } from '@earendil-works/pi-ai';

/** 解析完成的 LLM 配置（apiKey 已解密，仅在 provider 发起请求的瞬间存在） */
export interface LlmConfigResolved {
  id?: string; // DB 行 id（env 兜底配置无值）——用量流水 llmConfigId 归因用
  configKey: string;
  name: string;
  provider: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs: number;
  maxRetries: number;
}

/** 由 LlmConfig 行构建的 pi model 句柄 */
export interface PiModelHandle {
  models: Models;
  model: Model<'openai-completions'>;
}

/** Run 级 usage 聚合（token 预算熔断与 AgentRun.usage 落库共用） */
export interface LlmUsageAggregate {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export function emptyUsage(): LlmUsageAggregate {
  return { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}

/** 累加一次 pi Usage 到 run 级聚合 */
export function accumulateUsage(agg: LlmUsageAggregate, usage: Usage | undefined): void {
  agg.calls += 1;
  agg.promptTokens += usage?.input ?? 0;
  agg.completionTokens += usage?.output ?? 0;
  agg.totalTokens += (usage?.input ?? 0) + (usage?.output ?? 0);
}
