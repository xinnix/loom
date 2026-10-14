import { Injectable } from '@nestjs/common';
import { BaseService } from '../../common/base.service';
import { PrismaService } from '../../prisma/prisma.service';
import { computeNextRunAt } from './compute-next-run';
import type { AgentTriggerSchedule } from '@loom/shared';

/**
 * AgentTrigger 管理（ADR-009）。
 * nextRunAt 服务端计算：创建 / schedule 或 enabled 变更时重算（客户端不可指定调度水位）。
 */
@Injectable()
export class AgentTriggerService extends BaseService<'agentTrigger'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'agentTrigger');
  }

  async beforeCreate(data: Record<string, any>) {
    const next = { ...data };
    delete next.nextRunAt;
    delete next.lastRunAt;
    if (next.enabled !== false) {
      next.nextRunAt = computeNextRunAt(next.schedule as AgentTriggerSchedule, new Date());
    }
    return next;
  }

  async beforeUpdate(_id: string, data: Record<string, any>) {
    const next = { ...data };
    delete next.nextRunAt;
    // schedule / enabled 变更时重算水位；其余变更不动（保持调度节奏）
    if (next.schedule !== undefined || next.enabled !== undefined) {
      const current = await this.prisma.agentTrigger.findUnique({
        where: { id: _id },
        select: { schedule: true, enabled: true },
      });
      const schedule = (next.schedule ?? current?.schedule) as AgentTriggerSchedule | undefined;
      const enabled = next.enabled ?? current?.enabled ?? false;
      if (enabled && schedule) {
        next.nextRunAt = computeNextRunAt(schedule, new Date());
      }
    }
    return next;
  }
}
