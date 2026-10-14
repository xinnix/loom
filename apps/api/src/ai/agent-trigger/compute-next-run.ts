import type { AgentTriggerSchedule } from '@loom/shared';

/**
 * 受限调度的下次执行时间纯函数（导出供单测，ADR-009）：
 * HOURLY → 下一个整点（严格晚于 from）；DAILY_HH → 今天该时刻否则明天。
 * 整点对齐让扫表窗口天然不重不漏；加新时段 = 放宽 Zod 白名单（String 列零迁移）。
 */
export function computeNextRunAt(schedule: AgentTriggerSchedule, from: Date): Date {
  const next = new Date(from);
  next.setMinutes(0, 0, 0);
  if (schedule === 'HOURLY') {
    next.setHours(next.getHours() + 1);
    return next;
  }
  const hour = Number(schedule.slice('DAILY_'.length));
  next.setHours(hour);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * YML cron expression → 白名单 schedule（loader 同步用）。
 * '0 * * * *' → HOURLY；'0 H * * *' → DAILY_HH；其余形态不支持（返回 null，loader warn 跳过）。
 */
export function cronExpressionToSchedule(expression: string): AgentTriggerSchedule | null {
  const trimmed = expression.trim();
  if (trimmed === '0 * * * *') return 'HOURLY';
  const daily = trimmed.match(/^0 (\d{1,2}) \* \* \*$/);
  if (daily) {
    const hour = Number(daily[1]);
    if (hour >= 0 && hour <= 23)
      return `DAILY_${String(hour).padStart(2, '0')}` as AgentTriggerSchedule;
  }
  return null;
}
