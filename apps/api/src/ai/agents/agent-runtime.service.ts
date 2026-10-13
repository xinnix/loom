import { Injectable, Logger } from '@nestjs/common';
import type { AssistantMessage } from '@earendil-works/pi-ai';
// pi-agent-core 为 ESM-only：运行时值（agentLoop）经动态 import 加载，类型静态导入
import type { AgentEvent, AgentLoopConfig, AgentMessage } from '@earendil-works/pi-agent-core';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../core/exceptions';
import { BusinessException } from '../../core/exceptions/business.exception';
import { AgentYamlLoader } from './agent-yaml.loader';
import { AgentRunService } from './agent-run.service';
import { renderTemplate } from './prompt-template';
import { ToolRegistry } from '../tools/tool.registry';
import { LlmConfigService } from '../llm/llm-config.service';
import { LlmService } from '../llm/llm.service';
import { buildPiModel, dynamicImport } from '../llm/pi-model.factory';
import { accumulateUsage, emptyUsage, type LlmUsageAggregate } from '../llm/interfaces';
import type { WorkflowNode } from '@loom/shared';
import type { ToolExecutionContext } from '../tools/interfaces';

/** 默认 run 级 token 预算（OWASP token/cost limits；YML budgetTokens 可覆盖） */
const DEFAULT_BUDGET_TOKENS = 100_000;

export type RunEvent =
  | { type: 'run_start'; runId: string; agentSlug: string }
  | { type: 'node_start'; nodeId: string; nodeType: 'chat' | 'loop' }
  | { type: 'content'; nodeId: string; text: string }
  | { type: 'tool_call'; nodeId: string; name: string; args: unknown }
  | { type: 'tool_result'; nodeId: string; name: string; ok: boolean; ms: number }
  | { type: 'node_end'; nodeId: string; output: string }
  | { type: 'run_end'; runId: string; output: string; usage: LlmUsageAggregate }
  | { type: 'error'; message: string };

export type Emit = (event: RunEvent) => void;

export interface RunContext extends ToolExecutionContext {
  /** 请求级中止信号（客户端断连 → 中止 LLM fetch） */
  signal?: AbortSignal;
  triggeredById?: string;
  triggeredByType?: 'admin' | 'user';
}

export interface RunResult {
  runId: string;
  output: string;
  status: 'success' | 'truncated';
}

interface NodeTraceEntry {
  nodeId: string;
  type: 'chat' | 'loop';
  iterations: number;
  toolCalls: { name: string; args: unknown; ok: boolean; ms: number }[];
  durationMs: number;
  warnings?: string[];
}

/**
 * AI 第 3 层：Agent 编排执行器。
 *
 * workflow 严格顺序执行（ADR-005：无 DAG/分支/并行）。chat 节点流式
 * （text_delta 逐 emit），loop 节点经 pi-agent-core agentLoop 跑工具循环：
 * - beforeToolCall hook 强制 YML permission（授权先于执行，OWASP 模式）
 * - afterToolCall hook 记录审计轨迹
 * - finishTurn hook 承载 maxIterations 与 run 级 token 预算熔断
 */
@Injectable()
export class AgentRuntimeService {
  private readonly logger = new Logger(AgentRuntimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loader: AgentYamlLoader,
    private readonly agentRuns: AgentRunService,
    private readonly toolRegistry: ToolRegistry,
    private readonly llmConfig: LlmConfigService,
    private readonly llm: LlmService,
  ) {}

  async run(
    slug: string,
    input: Record<string, unknown>,
    ctx: RunContext,
    emit: Emit,
  ): Promise<RunResult> {
    const def = this.loader.getOrThrow(slug);
    const agentRow = await this.prisma.agent.findUnique({ where: { slug } });
    if (agentRow && !agentRow.isActive) {
      throw new BusinessException({
        message: `Agent ${slug} 已停用`,
        errorCode: ErrorCodes.AI_AGENT_DISABLED,
        statusCode: 409,
      });
    }

    const run = await this.agentRuns.create({
      agentId: agentRow?.id,
      agentSlug: slug,
      input,
      triggeredById: ctx.triggeredById,
      triggeredByType: ctx.triggeredByType,
    });
    emit({ type: 'run_start', runId: run.id, agentSlug: slug });

    const started = Date.now();
    const usage = emptyUsage();
    const nodeTrace: NodeTraceEntry[] = [];
    const nodesOutput: Record<string, string> = {};
    const allWarnings: string[] = [];
    let truncated = false;

    try {
      const budget = def.budgetTokens ?? DEFAULT_BUDGET_TOKENS;

      for (const node of def.workflow) {
        if (usage.totalTokens >= budget) {
          truncated = true;
          allWarnings.push(`token 预算（${budget}）已耗尽，跳过节点 ${node.id}`);
          break;
        }
        emit({ type: 'node_start', nodeId: node.id, nodeType: node.type });
        const nodeStart = Date.now();
        const trace: NodeTraceEntry = {
          nodeId: node.id,
          type: node.type,
          iterations: 1,
          toolCalls: [],
          durationMs: 0,
        };

        const rendered = this.renderNode(node, input, nodesOutput, allWarnings);
        const resolved = await this.resolveLlmForNode(node, agentRow?.llmConfigId);

        let output: string;
        if (node.type === 'chat') {
          output = await this.runChatNode(node, rendered, resolved, ctx, emit, usage, trace);
        } else {
          output = await this.runLoopNode(
            node,
            rendered,
            resolved,
            ctx,
            emit,
            usage,
            trace,
            budget,
          );
        }
        if (node.outputFormat === 'json') {
          output = this.enforceJsonOutput(node, output, allWarnings);
        }

        trace.durationMs = Date.now() - nodeStart;
        nodeTrace.push(trace);
        nodesOutput[node.id] = output;
        emit({ type: 'node_end', nodeId: node.id, output });
      }

      const output = def.output
        ? renderTemplate(def.output.template, { input, nodes: nodesOutput }).text
        : (nodesOutput[def.workflow[def.workflow.length - 1].id] ?? '');
      const status = truncated ? 'truncated' : 'success';
      const durationMs = Date.now() - started;
      if (truncated) allWarnings.push('[budget_exceeded：输出可能不完整]');

      await this.agentRuns.finish(run.id, {
        status,
        output,
        nodeTrace: { nodes: nodeTrace, warnings: allWarnings },
        usage,
        durationMs,
      });
      emit({ type: 'run_end', runId: run.id, output, usage });
      return { runId: run.id, output, status };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.agentRuns.finish(run.id, {
        status: 'failed',
        error: message,
        nodeTrace: { nodes: nodeTrace, warnings: allWarnings },
        usage,
        durationMs: Date.now() - started,
      });
      emit({ type: 'error', message });
      throw err;
    }
  }

  // ── 节点执行 ──────────────────────────────────────────────

  private async runChatNode(
    node: Extract<WorkflowNode, { type: 'chat' }>,
    rendered: { prompt: string; system?: string },
    resolved: Awaited<ReturnType<LlmConfigService['resolveDefault']>>,
    ctx: RunContext,
    emit: Emit,
    usage: LlmUsageAggregate,
    trace: NodeTraceEntry,
    retryWithError?: string,
  ): Promise<string> {
    const prompt = retryWithError
      ? `${rendered.prompt}\n\n（上一次输出不是合法 JSON，错误：${retryWithError}。请仅输出合法 JSON。）`
      : rendered.prompt;
    const stream = await this.llm.chatStreamWith(resolved, {
      systemPrompt: rendered.system,
      messages: [{ role: 'user', content: prompt, timestamp: Date.now() }],
      temperature: node.llm ? undefined : undefined,
      signal: ctx.signal,
    });

    let output = '';
    let finalMessage: AssistantMessage | undefined;
    for await (const event of stream) {
      if (event.type === 'text_delta') {
        output += event.delta;
        emit({ type: 'content', nodeId: node.id, text: event.delta });
      } else if (event.type === 'done') {
        finalMessage = event.message;
      } else if (event.type === 'error') {
        this.llm.assertOk(event.error, resolved.configKey);
      }
    }
    if (finalMessage) accumulateUsage(usage, finalMessage.usage);
    if (finalMessage) this.llm.assertOk(finalMessage, resolved.configKey);

    // json 输出失败自动重试一次（chat 节点专属）
    if (node.outputFormat === 'json' && !retryWithError && !tryParseJson(output).ok) {
      trace.iterations += 1;
      return this.runChatNode(
        node,
        rendered,
        resolved,
        ctx,
        emit,
        usage,
        trace,
        '输出无法解析为 JSON',
      );
    }
    return output;
  }

  private async runLoopNode(
    node: Extract<WorkflowNode, { type: 'loop' }>,
    rendered: { prompt: string; system?: string },
    resolved: Awaited<ReturnType<LlmConfigService['resolveDefault']>>,
    ctx: RunContext,
    emit: Emit,
    usage: LlmUsageAggregate,
    trace: NodeTraceEntry,
    budget: number,
  ): Promise<string> {
    const tools = this.toolRegistry.toPiTools(node.tools ?? [], ctx);
    const userMessage: AgentMessage = {
      role: 'user',
      content: rendered.prompt,
      timestamp: Date.now(),
    };
    const handle = await buildPiModel(resolved);
    let iterations = 0;
    let budgetHit = false;

    const config: AgentLoopConfig = {
      model: handle.model,
      convertToLlm: (messages) => messages,
      temperature: resolved.temperature,
      maxTokens: resolved.maxTokens,
      signal: ctx.signal,
      // 权限闸门：授权先于工具执行（D4 第二道闸门，OWASP Tool Authorization Middleware）
      beforeToolCall: async (c) => {
        const tool = this.toolRegistry.get(c.toolCall.name);
        if (!tool) return { block: true, reason: `未知工具: ${c.toolCall.name}` };
        if (tool.permission && !ctx.permissions.includes(tool.permission)) {
          return { block: true, reason: `权限不足：需要 ${tool.permission}` };
        }
        emit({
          type: 'tool_call',
          nodeId: node.id,
          name: c.toolCall.name,
          args: c.args,
        });
        return undefined;
      },
      // 审计轨迹
      afterToolCall: async (c) => {
        trace.toolCalls.push({
          name: c.toolCall.name,
          args: c.args,
          ok: !c.isError,
          ms: c.result.details?.durationMs ?? 0,
        });
        emit({
          type: 'tool_result',
          nodeId: node.id,
          name: c.toolCall.name,
          ok: !c.isError,
          ms: c.result.details?.durationMs ?? 0,
        });
        return undefined;
      },
      // maxIterations 与 token 预算熔断
      finishTurn: (turn) => {
        iterations += 1;
        accumulateUsage(usage, turn.message.usage);
        trace.iterations = iterations;
        if (iterations >= node.maxIterations) {
          this.logger.warn(
            `loop 节点 ${node.id} 达到 maxIterations=${node.maxIterations}，标记 truncated`,
          );
          return { action: 'end' };
        }
        if (usage.totalTokens >= budget) {
          budgetHit = true;
          return { action: 'end' };
        }
        return undefined;
      },
    };

    // pi-agent-core 为 ESM-only，走 dynamicImport 保留原生动态导入（见 pi-model.factory）
    const { agentLoop } = (await dynamicImport(
      '@earendil-works/pi-agent-core',
    )) as typeof import('@earendil-works/pi-agent-core');
    const stream = agentLoop(
      [userMessage],
      { messages: [], tools },
      config,
      ctx.signal,
      (model, transcript, options) => handle.models.streamSimple(model, transcript, options),
    );

    let finalText = '';
    for await (const event of stream) {
      const e = event as AgentEvent;
      if (e.type === 'message_update' && e.assistantMessageEvent.type === 'text_delta') {
        const delta = e.assistantMessageEvent.delta;
        finalText += delta;
        emit({ type: 'content', nodeId: node.id, text: delta });
      } else if (e.type === 'agent_end') {
        const messages = e.messages;
        const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant') as
          AssistantMessage | undefined;
        if (lastAssistant) {
          finalText = assistantText(lastAssistant) || finalText;
          this.llm.assertOk(lastAssistant, resolved.configKey);
        }
      }
    }
    await stream.result();
    if (budgetHit) trace.iterations = iterations; // budget 命中信息由 run 级 warnings 记录
    return finalText;
  }

  // ── 辅助 ──────────────────────────────────────────────

  /** D3：node.llm > Agent.llmConfigId > isDefault/env */
  private async resolveLlmForNode(node: WorkflowNode, agentLlmConfigId?: string | null) {
    if (node.llm) return this.llmConfig.resolveByRef({ configKey: node.llm });
    if (agentLlmConfigId) {
      const byAgent = await this.llmConfig.findById(agentLlmConfigId);
      if (byAgent) return byAgent;
    }
    return this.llmConfig.resolveDefault();
  }

  private renderNode(
    node: WorkflowNode,
    input: Record<string, unknown>,
    nodesOutput: Record<string, string>,
    warnings: string[],
  ): { prompt: string; system?: string } {
    const scope = { input, nodes: nodesOutput };
    const prompt = renderTemplate(node.prompt, scope);
    const system = node.system ? renderTemplate(node.system, scope) : undefined;
    warnings.push(...prompt.warnings, ...(system?.warnings ?? []));
    return { prompt: prompt.text, system: system?.text };
  }

  /** outputFormat: json 的输出规整：剥离 markdown fence + 解析校验（失败保留原文并记 warning） */
  private enforceJsonOutput(node: WorkflowNode, output: string, warnings: string[]): string {
    const parsed = tryParseJson(output);
    if (parsed.ok) return JSON.stringify(parsed.value);
    warnings.push(`节点 ${node.id} 声明 outputFormat=json 但输出无法解析为 JSON，已保留原文`);
    return output;
  }
}

function assistantText(message: AssistantMessage): string {
  return message.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('');
}

function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  const trimmed = text.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) candidates.push(fenced[1].trim());
  for (const candidate of candidates) {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      // 尝试下一个候选
    }
  }
  return { ok: false };
}
