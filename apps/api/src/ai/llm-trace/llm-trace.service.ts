import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import type { AssistantMessage, AssistantMessageEventStream } from '@earendil-works/pi-ai';
import type { Prisma } from '@loom/database';
import { PrismaService } from '../../prisma/prisma.service';

/** 调用方提供的归因元数据（agent 调用时 traceId=runId、sceneKey=agentSlug） */
export interface LlmTraceMeta {
  traceId?: string;
  sceneKey?: string;
  llmConfigId?: string | null;
  props?: Record<string, unknown>;
}

/** 一次 LLM 调用的度量结果（埋点方组装，record 内补默认值后落库） */
export interface LlmCallLogDraft extends LlmTraceMeta {
  callType: LlmCallTypeValue;
  model: string;
  status?: LlmCallStatusValue;
  inputTokens?: number | null;
  outputTokens?: number | null;
  promptChars?: number | null;
  completionChars?: number | null;
  latencyMs?: number | null;
  errorClass?: string | null;
  errorMsg?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
}

/** 值域对齐 schema.prisma String 字段注释（shared Zod 枚举同源；无 Prisma enum 惯例） */
export type LlmCallStatusValue = 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'ABORTED';
export type LlmCallTypeValue = 'CHAT' | 'CHAT_STREAM' | 'AGENT_LOOP';

/** createMany 行形状（normalize 产物；显式声明避免私有方法自引用的解析歧义） */
interface LlmCallLogRow {
  traceId: string;
  sceneKey: string | null;
  callType: LlmCallTypeValue;
  model: string;
  llmConfigId: string | null;
  status: LlmCallStatusValue;
  inputTokens: number | null;
  outputTokens: number | null;
  promptChars: number | null;
  completionChars: number | null;
  latencyMs: number | null;
  errorClass: string | null;
  errorMsg: string | null;
  temperature: number | null;
  maxTokens: number | null;
  day: string;
  props?: Prisma.InputJsonValue;
}

const FLUSH_INTERVAL_MS = 500;
const FLUSH_BATCH_SIZE = 50;
const MAX_PENDING = 5000; // 背压上限：DB 不可用时丢弃超额新纪录，保内存
const RETENTION_DAYS = 30;

/** 统计日桶（UTC+8）：与服务器时区解耦，趋势聚合单源 */
export function dayBucketUtc8(t: Date): string {
  return new Date(t.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);
}

/** 抛出型错误的粗分类（provider 错误多数经 pi 收敛为 stopReason，不走此处） */
export function classifyLlmError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : '';
  if (name === 'AbortError' || /abort/i.test(message)) return 'abort';
  if (name === 'TimeoutError' || /timeout|timed?\s*out/i.test(message)) return 'timeout';
  if (/\b4\d{2}\b/.test(message)) return 'http_4xx';
  if (/\b5\d{2}\b/.test(message)) return 'http_5xx';
  return 'unknown';
}

function statusFromError(err: unknown): LlmCallStatusValue {
  const cls = classifyLlmError(err);
  if (cls === 'timeout') return 'TIMEOUT';
  if (cls === 'abort') return 'ABORTED';
  return 'ERROR';
}

function assistantTextLen(message: AssistantMessage): number {
  return message.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .reduce((n, c) => n + c.text.length, 0);
}

/** 流观察埋点的公共底稿（终态字段由 result() 结果补齐） */
export interface LlmStreamTraceBase extends LlmTraceMeta {
  callType: LlmCallTypeValue;
  model: string;
  promptChars?: number | null;
  temperature?: number | null;
  maxTokens?: number | null;
}

/**
 * 观察一条 pi 事件流的终态并落一条流水（埋点零行为改变，ADR-007 不变式 4）：
 * 只旁听 result()（EventStream 终态 Promise，与消费方迭代互不干扰），
 * 不消费、不改写、不转发任何事件；result() 永不落定（如消费方中途抛出）则不记录。
 */
export function traceLlmStream(
  stream: AssistantMessageEventStream,
  base: LlmStreamTraceBase,
  record: (draft: LlmCallLogDraft) => void,
): AssistantMessageEventStream {
  const started = Date.now();
  void stream
    .result()
    .then((message) => {
      const status: LlmCallStatusValue =
        message.stopReason === 'error'
          ? 'ERROR'
          : message.stopReason === 'aborted'
            ? 'ABORTED'
            : 'SUCCESS';
      record({
        ...base,
        status,
        inputTokens: message.usage?.input ?? null,
        outputTokens: message.usage?.output ?? null,
        completionChars: assistantTextLen(message),
        latencyMs: message.durationMs ?? Date.now() - started,
        errorClass: status === 'ERROR' ? 'unknown' : null,
        errorMsg:
          status === 'ERROR' ? String(message.errorMessage ?? '').slice(0, 200) || null : null,
      });
    })
    .catch((err: unknown) => {
      record({
        ...base,
        status: statusFromError(err),
        errorClass: classifyLlmError(err),
        errorMsg: (err instanceof Error ? err.message : String(err)).slice(0, 200),
        latencyMs: Date.now() - started,
      });
    });
  return stream;
}

/**
 * LLM 调用流水写入管线（附属设施，永不阻断业务，ADR-007）：
 * record() 同步入内存双缓冲 → 500ms 定时 / 满 50 条批量 createMany；
 * 写失败仅节流告警并丢弃，不重试；错误/超时/中止恒记录不采样。
 * 带 retention @Cron，必须单一 Module 声明（铁律，见 llm-trace.module.ts）。
 */
@Injectable()
export class LlmTraceService implements OnModuleDestroy {
  private readonly logger = new Logger(LlmTraceService.name);
  private active: LlmCallLogRow[] = [];
  private timer: NodeJS.Timeout | null = null;
  private flushingNow = false;
  private lastWarnAt = 0;
  private readonly sampleRate = LlmTraceService.resolveSampleRate();

  constructor(private readonly prisma: PrismaService) {}

  /** 采样率：env 直读一次（基础设施变量）；非法值回落全量 */
  private static resolveSampleRate(): number {
    const raw = Number(process.env.LLM_TRACE_SAMPLE_RATE);
    if (!Number.isFinite(raw) || raw <= 0 || raw > 1) return 1;
    return raw;
  }

  /** 同步、永不 throw：埋点方可以无脑调用 */
  record(draft: LlmCallLogDraft): void {
    try {
      const status = draft.status ?? 'SUCCESS';
      // 采样：error/timeout/aborted 恒记录
      if (status === 'SUCCESS' && this.sampleRate < 1 && Math.random() >= this.sampleRate) {
        return;
      }
      if (this.active.length >= MAX_PENDING) return;
      this.active.push(this.normalize(draft, status));
      if (this.active.length >= FLUSH_BATCH_SIZE) {
        void this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => {
          this.timer = null;
          void this.flush();
        }, FLUSH_INTERVAL_MS);
        this.timer.unref?.();
      }
    } catch {
      /* 静默：trace 绝不干扰业务链路 */
    }
  }

  async flush(): Promise<void> {
    if (this.flushingNow) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.flushingNow = true;
    try {
      while (this.active.length > 0) {
        const batch = this.active.splice(0, FLUSH_BATCH_SIZE);
        try {
          await this.prisma.llmCallLog.createMany({ data: batch });
        } catch (e) {
          const now = Date.now();
          if (now - this.lastWarnAt > 60_000) {
            this.lastWarnAt = now;
            this.logger.warn(
              `[llm-trace] 用量落库失败，丢弃 ${batch.length} 条：${(e as Error)?.message}`,
            );
          }
        }
      }
    } finally {
      this.flushingNow = false;
    }
  }

  /** 每日低峰清理 30 天前明细（loom 侧无画像 cron，常规 05:40 低峰位） */
  @Cron('40 5 * * *')
  async purgeRetention(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
      const r = await this.prisma.llmCallLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
      if (r.count) {
        this.logger.log(`[llm-trace] 已清理 ${r.count} 条 ${RETENTION_DAYS} 天前用量明细`);
      }
    } catch (e) {
      this.logger.warn(`[llm-trace] retention 清理失败：${(e as Error)?.message}`);
    }
  }

  /** 优雅停机兜底：尽力清空缓冲 */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.flush();
    } catch {
      /* 停机期 DB 可能已断开，忽略 */
    }
  }

  private normalize(draft: LlmCallLogDraft, status: LlmCallStatusValue): LlmCallLogRow {
    const props = draft.props ?? {};
    return {
      traceId: draft.traceId ?? randomUUID(),
      sceneKey: draft.sceneKey ?? null,
      callType: draft.callType,
      model: draft.model,
      llmConfigId: draft.llmConfigId ?? null,
      status,
      inputTokens: draft.inputTokens ?? null,
      outputTokens: draft.outputTokens ?? null,
      promptChars: draft.promptChars ?? null,
      completionChars: draft.completionChars ?? null,
      latencyMs: draft.latencyMs ?? null,
      errorClass: draft.errorClass ?? null,
      errorMsg: draft.errorMsg ? draft.errorMsg.slice(0, 200) : null,
      temperature: draft.temperature ?? null,
      maxTokens: draft.maxTokens ?? null,
      day: dayBucketUtc8(new Date()),
      props: Object.keys(props).length ? (props as Prisma.InputJsonValue) : undefined,
    };
  }
}
