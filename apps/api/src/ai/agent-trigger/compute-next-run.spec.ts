import { describe, expect, it } from 'vitest';
import { computeNextRunAt, cronExpressionToSchedule } from './compute-next-run';

describe('computeNextRunAt（受限调度纯函数，ADR-009）', () => {
  // 函数为本地时区语义（setHours），用本地时间构造避免 CI 时区漂移
  it('HOURLY：下一个严格晚于 from 的整点', () => {
    expect(computeNextRunAt('HOURLY', new Date(2026, 9, 14, 8, 0, 0))).toEqual(
      new Date(2026, 9, 14, 9, 0, 0),
    );
    expect(computeNextRunAt('HOURLY', new Date(2026, 9, 14, 8, 30, 59))).toEqual(
      new Date(2026, 9, 14, 9, 0, 0),
    );
  });

  it('DAILY_09：当日 09:00 未过 → 今天；已过 → 明天', () => {
    expect(computeNextRunAt('DAILY_09', new Date(2026, 9, 14, 2, 0, 0))).toEqual(
      new Date(2026, 9, 14, 9, 0, 0),
    );
    expect(computeNextRunAt('DAILY_09', new Date(2026, 9, 14, 10, 0, 0))).toEqual(
      new Date(2026, 9, 15, 9, 0, 0),
    );
  });

  it('跨日边界：23:59 的 DAILY_04 → 次日 04:00', () => {
    expect(computeNextRunAt('DAILY_04', new Date(2026, 9, 14, 23, 59, 0))).toEqual(
      new Date(2026, 9, 15, 4, 0, 0),
    );
  });
});

describe('cronExpressionToSchedule（YML expression → 白名单形态）', () => {
  it('整点表达式映射', () => {
    expect(cronExpressionToSchedule('0 * * * *')).toBe('HOURLY');
    expect(cronExpressionToSchedule('0 9 * * *')).toBe('DAILY_09');
    expect(cronExpressionToSchedule('0 04 * * *')).toBe('DAILY_04');
  });

  it('超出白名单形态返回 null（loader warn 跳过）', () => {
    expect(cronExpressionToSchedule('*/30 * * * *')).toBeNull();
    expect(cronExpressionToSchedule('0 9 * * 1-5')).toBeNull();
    expect(cronExpressionToSchedule('30 9 * * *')).toBeNull();
  });
});
