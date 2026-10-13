import { Injectable, Logger } from '@nestjs/common';
import { ErrorCodes } from '../../core/exceptions';
import { BusinessException } from '../../core/exceptions/business.exception';
import { validateAgainstSchema } from './tool.schema-validator';
import type { ResolvedTool, ToolExecutionContext, ToolExecutionResult } from './interfaces';

/** 工具结果回给 LLM 的最大体积（防止多工具多轮累积撑爆上下文） */
export const TOOL_RESULT_MAX_BYTES = 50 * 1024;

/**
 * AI 第 2 层：工具执行器（OWASP Tool Authorization Middleware 的执行端）。
 *
 * 执行顺序：参数防御性校验 → YML permission 闸门 → 本机回环 REST。
 * SSRF 防护（D4）：scheme/host/port 为代码常量拼接、path 仅来自启动校验过的
 * YML 常量、method 白名单、redirect: 'error'——LLM 产出的一切内容都无法
 * 改变请求目标。
 */
@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  async execute(
    tool: ResolvedTool,
    args: Record<string, unknown>,
    ctx: ToolExecutionContext,
    signal?: AbortSignal,
  ): Promise<ToolExecutionResult> {
    const started = Date.now();

    // 1. 参数防御性校验（pi/AJV 已校验过，此处为安全边界二次确认）
    const validation = validateAgainstSchema(args, tool.parameters);
    if (!validation.ok) {
      return {
        ok: false,
        error: `参数校验失败: ${validation.errors.join('; ')}`,
        durationMs: Date.now() - started,
      };
    }

    // 2. YML permission 第二道闸门（缺省 = 任何通过认证的触发者可调）
    if (tool.permission && !ctx.permissions.includes(tool.permission)) {
      throw new BusinessException({
        message: `工具 ${tool.name} 需要权限 ${tool.permission}，当前触发者不具备`,
        errorCode: ErrorCodes.AI_TOOL_EXEC_FAILED,
        statusCode: 403,
        details: { tool: tool.name, required: tool.permission },
      });
    }

    // 3. 本机回环 REST（转发触发者原始 JWT）
    try {
      const url = buildLoopbackUrl(tool);
      const method = tool.rest.method;
      const placement = tool.rest.paramPlacement ?? (method === 'GET' ? 'query' : 'body');
      const fetchOptions: RequestInit = {
        method,
        headers: {
          ...(ctx.authorization ? { Authorization: ctx.authorization } : {}),
          'Content-Type': 'application/json',
        },
        redirect: 'error',
      };
      if (placement === 'query') {
        for (const [k, v] of Object.entries(args)) {
          url.searchParams.set(k, String(v));
        }
      } else {
        fetchOptions.body = JSON.stringify(args);
      }

      const timeoutMs = tool.rest.timeoutMs ?? 15_000;
      const timeoutSignal = AbortSignal.timeout(timeoutMs);
      fetchOptions.signal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

      const response = await fetch(url.href, fetchOptions);
      const text = await response.text();

      if (!response.ok) {
        return {
          ok: false,
          error: `内部接口返回 ${response.status}: ${truncate(text, 500)}`,
          durationMs: Date.now() - started,
        };
      }

      let data: unknown = text;
      try {
        data = JSON.parse(text);
      } catch {
        // 非 JSON 响应保留原文
      }
      return {
        ok: true,
        data: truncateData(data),
        durationMs: Date.now() - started,
      };
    } catch (err) {
      if (signal?.aborted) throw err;
      this.logger.warn(`工具 ${tool.name} 执行失败: ${(err as Error).message}`);
      return {
        ok: false,
        error: `工具执行失败: ${(err as Error).message}`,
        durationMs: Date.now() - started,
      };
    }
  }
}

/** 回环 URL：仅代码常量拼接，path 来自启动校验过的 YML */
function buildLoopbackUrl(tool: ResolvedTool): URL {
  const port = process.env.PORT || '3000';
  return new URL(`http://127.0.0.1:${port}${tool.rest.path}`);
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…[truncated]` : text;
}

function truncateData(data: unknown): unknown {
  const serialized = JSON.stringify(data);
  if (serialized && serialized.length > TOOL_RESULT_MAX_BYTES) {
    if (typeof data === 'string') return truncate(data, TOOL_RESULT_MAX_BYTES);
    return {
      truncated: true,
      preview: serialized.slice(0, TOOL_RESULT_MAX_BYTES),
      note: `[truncated：结果超过 ${TOOL_RESULT_MAX_BYTES} 字节]`,
    };
  }
  return data;
}
