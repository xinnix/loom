import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { parse as parseYaml } from 'yaml';
import { ToolFileYmlSchema, type ToolParameterSchema } from '@loom/shared';
import { ErrorCodes } from '../../core/exceptions';
import { BusinessException } from '../../core/exceptions/business.exception';
import { ToolExecutor } from './tool.executor';
import type { ResolvedTool, ToolExecutionContext, ToolProvider, ToolRunAudit } from './interfaces';
import type { AgentTool } from '@earendil-works/pi-agent-core';

/**
 * AI 第 2 层：工具注册中心。
 *
 * 真理源：definitions/tools/*.yml（git 版本控制），启动时解析 + shared Zod
 * 校验（失败即启动失败，错误含文件名与 Zod issue 路径）。
 * `registerToolProvider()` 是代码工具扩展点（source: 'code'），与 YML 工具同构。
 *
 * 注意：aiTools 的 tRPC router 数据源是本 registry（内存对象），不是 Prisma——
 * 这是 createCrudRouter 工厂的合理例外。
 */
@Injectable()
export class ToolRegistry implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistry.name);
  private readonly tools = new Map<string, ResolvedTool & { provider?: ToolProvider }>();

  constructor(private readonly executor: ToolExecutor) {}

  get definitionsDir(): string {
    return path.join(__dirname, '../definitions/tools');
  }

  onModuleInit(): void {
    const loaded = this.loadFromYml();
    this.logger.log(`已注册 ${this.tools.size} 个 AI 工具（YML: ${loaded}）`);
  }

  /** 扫描并加载 YML 工具；返回加载数量 */
  loadFromYml(): number {
    const dir = this.definitionsDir;
    if (!fs.existsSync(dir)) {
      this.logger.warn(`工具定义目录不存在: ${dir}`);
      return 0;
    }
    let count = 0;
    for (const file of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
      const full = path.join(dir, file);
      let parsed: unknown;
      try {
        parsed = parseYaml(fs.readFileSync(full, 'utf8'));
      } catch (err) {
        throw new BusinessException({
          message: `工具 YML 解析失败 ${file}: ${(err as Error).message}`,
          errorCode: ErrorCodes.AI_YAML_INVALID,
        });
      }
      const result = ToolFileYmlSchema.safeParse(parsed);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        throw new BusinessException({
          message: `工具 YML 校验失败 ${file}: ${issues}`,
          errorCode: ErrorCodes.AI_YAML_INVALID,
        });
      }
      for (const tool of result.data.tools) {
        this.register(
          {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters as ToolParameterSchema,
            permission: tool.permission,
            rest: tool.rest,
            source: 'yml',
          },
          file,
        );
        count += 1;
      }
    }
    return count;
  }

  /** 代码工具扩展点（重名即抛） */
  registerToolProvider(provider: ToolProvider): void {
    this.register(
      {
        name: provider.name,
        description: provider.description,
        parameters: provider.parameters,
        permission: provider.permission,
        rest: { method: 'POST', path: '/internal/code-tool' }, // 占位：code 工具不经 REST
        source: 'code',
      },
      'code',
      provider,
    );
  }

  private register(
    tool: ResolvedTool & { provider?: ToolProvider },
    origin: string,
    provider?: ToolProvider,
  ): void {
    if (this.tools.has(tool.name)) {
      throw new BusinessException({
        message: `AI 工具重名: ${tool.name}（来源: ${origin}）`,
        errorCode: ErrorCodes.AI_YAML_INVALID,
      });
    }
    this.tools.set(tool.name, provider ? { ...tool, provider } : tool);
  }

  get(name: string): (ResolvedTool & { provider?: ToolProvider }) | undefined {
    return this.tools.get(name);
  }

  getOrThrow(name: string): ResolvedTool & { provider?: ToolProvider } {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new BusinessException({
        message: `AI 工具不存在: ${name}`,
        errorCode: ErrorCodes.AI_TOOL_NOT_FOUND,
        statusCode: 404,
      });
    }
    return tool;
  }

  list(): ResolvedTool[] {
    return [...this.tools.values()].map(({ provider: _provider, ...tool }) => tool);
  }

  /**
   * 将工具名列表转为 pi AgentTool（每次 run 构建——执行上下文绑定触发者身份）。
   * 执行失败以 isError tool result 回给 LLM 自行纠正，不中断 run；
   * 权限不足（AI_TOOL_EXEC_FAILED/403）是安全事件，直接抛出终止 run。
   */
  toPiTools(names: string[], ctx: ToolExecutionContext): AgentTool[] {
    return names.map((name) => {
      const tool = this.getOrThrow(name);
      const executor = this.executor;
      const audit: ToolRunAudit[] = ((
        ctx as ToolExecutionContext & { __audits?: ToolRunAudit[] }
      ).__audits ??= []);
      return {
        name: tool.name,
        label: tool.name,
        description: tool.description,
        // YML parameters 是纯 JSON Schema，与 TypeBox/AJV 同构
        parameters: tool.parameters as AgentTool['parameters'],
        execute: async (_toolCallId: string, rawParams: unknown, signal?: AbortSignal) => {
          const params = (rawParams ?? {}) as Record<string, unknown>;
          // 代码工具直接委托 provider；YML 工具走 REST 执行器
          const result =
            tool.source === 'code' && tool.provider
              ? await tool.provider.execute(params, ctx, signal)
              : await executor.execute(tool, params, ctx, signal);
          audit.push({
            name: tool.name,
            args: params,
            ok: result.ok,
            ms: result.durationMs,
            error: result.error,
          });
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result.ok ? result.data : { error: result.error }),
              },
            ],
            details: result,
            isError: !result.ok,
          };
        },
      };
    });
  }
}
