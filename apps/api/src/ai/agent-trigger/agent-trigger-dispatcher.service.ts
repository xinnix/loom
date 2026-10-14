import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { AgentTriggerSchedule } from '@loom/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../shared/settings/settings.service';
import { AgentTriggerRunnerService } from './agent-trigger-runner.service';
import { computeNextRunAt } from './compute-next-run';

/** dispatcher 消费的触发器最小形状（CAS where 用读到的 nextRunAt 原值） */
interface DueTrigger {
  id: string;
  nextRunAt: Date;
  schedule: AgentTriggerSchedule;
}

/**
 * Agent 触发器 dispatcher（ADR-009）：@Cron 整点扫表 → CAS 原子抢占 → run(agentSlug)。
 * 灰度门控 AGENT_TRIGGER_ENABLED!=='true' 时零动作（平台参数中心，默认关闭）。
 * CAS 抢占后崩溃：该时段产出丢失但不重放（水位已推进），AgentRun 缺行可人工排查；
 * 执行中崩溃：runtime.run 自身已落 failed AgentRun。
 */
@Injectable()
export class AgentTriggerDispatcherService {
  private readonly logger = new Logger(AgentTriggerDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly runner: AgentTriggerRunnerService,
  ) {}

  @Cron('0 * * * *')
  async dispatch(): Promise<void> {
    if (this.settings.get('AGENT_TRIGGER_ENABLED') !== 'true') return;
    const now = new Date();
    const due = await this.prisma.agentTrigger.findMany({
      where: { enabled: true, nextRunAt: { lte: now } },
      take: 50,
    });
    for (const t of due) {
      await this.runTrigger(t as DueTrigger, now).catch((err: Error) =>
        this.logger.warn(`触发器调度失败 ${t.id}: ${err?.message}`),
      );
    }
  }

  /** 手动触发入口（runOnce）：不占用调度水位（不推进 nextRunAt） */
  async runOnce(triggerId: string): Promise<{ runId: string; status: string } | null> {
    const trigger = await this.prisma.agentTrigger.findUnique({ where: { id: triggerId } });
    if (!trigger || !trigger.enabled) return null;
    return this.runner.execute(trigger);
  }

  /** CAS 原子抢占（nextRunAt 水位 compare-and-swap）→ 执行 */
  private async runTrigger(t: DueTrigger, now: Date): Promise<void> {
    // count===0 = 已被抢占（并发 dispatcher / 重复实例兜底），静默跳过
    const claimed = await this.prisma.agentTrigger.updateMany({
      where: { id: t.id, nextRunAt: t.nextRunAt },
      data: { lastRunAt: now, nextRunAt: computeNextRunAt(t.schedule, now) },
    });
    if (claimed.count === 0) return;

    const trigger = await this.prisma.agentTrigger.findUnique({ where: { id: t.id } });
    if (!trigger) return;
    // 失败仅告警：runtime.run 已自落 failed AgentRun，水位已推进不重放
    await this.runner
      .execute(trigger)
      .catch((err: Error) => this.logger.warn(`触发器执行失败 ${trigger.name}: ${err?.message}`));
  }
}
