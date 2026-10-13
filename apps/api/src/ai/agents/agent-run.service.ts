import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AgentRunCreateInput {
  agentId?: string | null;
  agentSlug: string;
  input: unknown;
  triggeredById?: string;
  triggeredByType?: 'admin' | 'user';
}

export interface AgentRunFinishInput {
  status: 'success' | 'failed' | 'truncated';
  output?: string;
  error?: string;
  nodeTrace?: unknown;
  usage?: unknown;
  durationMs?: number;
}

/**
 * AgentRun 执行记录落库。
 * 普通 Injectable 而非 BaseService 子类：run 生命周期由执行器驱动、
 * 无管理面 CRUD（Admin 端经 tRPC 只读查询），不适用 CRUD 基类抽象。
 */
@Injectable()
export class AgentRunService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: AgentRunCreateInput) {
    return this.prisma.agentRun.create({
      data: {
        agentId: input.agentId ?? undefined,
        agentSlug: input.agentSlug,
        status: 'running',
        input: input.input as object,
        triggeredById: input.triggeredById,
        triggeredByType: input.triggeredByType,
      },
    });
  }

  async finish(runId: string, input: AgentRunFinishInput) {
    return this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: input.status,
        output: input.output,
        error: input.error,
        nodeTrace: input.nodeTrace === undefined ? undefined : (input.nodeTrace as object),
        usage: input.usage === undefined ? undefined : (input.usage as object),
        durationMs: input.durationMs,
      },
    });
  }

  async listBySlug(slug: string, page = 1, pageSize = 10) {
    const [items, total] = await Promise.all([
      this.prisma.agentRun.findMany({
        where: { agentSlug: slug },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.agentRun.count({ where: { agentSlug: slug } }),
    ]);
    return { items, total, page, pageSize };
  }
}
