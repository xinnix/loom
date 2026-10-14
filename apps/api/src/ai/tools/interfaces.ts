import type { AgentTool, AgentToolResult } from '@earendil-works/pi-agent-core';
import type { ToolParameterSchema } from '@loom/shared';
import type { LlmUsageAggregate } from '../llm/interfaces';

/**
 * AI 第 2 层：工具执行上下文。
 * 由 REST controller 从触发请求中提取后传入，随 run 贯穿（D4：权限跟随触发者）。
 */
export interface ToolExecutionContext {
  /** 触发者的原始 Authorization 头（转发给内部 REST，权限跟随人走） */
  authorization?: string;
  /** 触发者权限集合（YML permission 第二道闸门用） */
  permissions: string[];
  userId?: string;
  userType?: 'admin' | 'user' | 'trigger';
}

/** YML 声明的 REST 映射工具（解析后的内存形态） */
export interface ResolvedTool {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  permission?: string;
  rest: {
    method: 'GET' | 'POST';
    path: string;
    paramPlacement?: 'query' | 'body';
    timeoutMs?: number;
  };
  source: 'yml' | 'code';
}

/** 代码注册工具的扩展点接口（与 YML 工具在 registry 内同构） */
export interface ToolProvider {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  permission?: string;
  execute(
    args: Record<string, unknown>,
    ctx: ToolExecutionContext,
    signal?: AbortSignal,
  ): Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  ok: boolean;
  /** 回给 LLM 的内容（已截断） */
  data?: unknown;
  /** 失败时的结构化错误信息（回给 LLM 自行纠正，不中断 run） */
  error?: string;
  durationMs: number;
}

export interface ToolRunAudit {
  name: string;
  args: unknown;
  ok: boolean;
  ms: number;
  error?: string;
}

export type { AgentTool, AgentToolResult, LlmUsageAggregate };
