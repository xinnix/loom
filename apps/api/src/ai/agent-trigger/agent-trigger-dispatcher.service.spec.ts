import { describe, expect, it, vi } from 'vitest';
import { AgentTriggerDispatcherService } from './agent-trigger-dispatcher.service';

function makeDeps(opts: { gate?: string } = {}) {
  const prisma = {
    agentTrigger: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const settings = {
    get: vi.fn((key: string) => (key === 'AGENT_TRIGGER_ENABLED' ? opts.gate : undefined)),
  };
  const runner = { execute: vi.fn().mockResolvedValue({ runId: 'run-1', status: 'success' }) };
  const svc = new AgentTriggerDispatcherService(prisma as any, settings as any, runner as any);
  return { svc, prisma, settings, runner };
}

const dueTrigger = {
  id: 't1',
  name: 'YML: todo-analyst',
  agentSlug: 'todo-analyst',
  schedule: 'DAILY_09',
  input: null,
  enabled: true,
  nextRunAt: new Date('2026-10-14T01:00:00Z'),
};

describe('AgentTriggerDispatcherService（ADR-009 机制）', () => {
  it('灰度门控关闭（非 true）→ 零动作不扫表', async () => {
    const { svc, prisma } = makeDeps({ gate: undefined });
    await svc.dispatch();
    expect(prisma.agentTrigger.findMany).not.toHaveBeenCalled();
  });

  it('门控开启 → 扫表 + CAS 抢占（where 含读值 nextRunAt）+ 执行', async () => {
    const { svc, prisma, runner } = makeDeps({ gate: 'true' });
    prisma.agentTrigger.findMany.mockResolvedValue([dueTrigger]);
    prisma.agentTrigger.findUnique.mockResolvedValue(dueTrigger);

    await svc.dispatch();

    expect(prisma.agentTrigger.updateMany).toHaveBeenCalledWith({
      where: { id: 't1', nextRunAt: dueTrigger.nextRunAt },
      data: {
        lastRunAt: expect.any(Date),
        nextRunAt: expect.any(Date),
      },
    });
    expect(runner.execute).toHaveBeenCalledWith(
      expect.objectContaining({ agentSlug: 'todo-analyst' }),
    );
  });

  it('CAS count=0（已被并发抢占）→ 静默跳过不执行', async () => {
    const { svc, prisma, runner } = makeDeps({ gate: 'true' });
    prisma.agentTrigger.findMany.mockResolvedValue([dueTrigger]);
    prisma.agentTrigger.updateMany.mockResolvedValue({ count: 0 });

    await svc.dispatch();

    expect(runner.execute).not.toHaveBeenCalled();
  });

  it('runner 抛错 → 调度不中断（水位已推进，不重放）', async () => {
    const { svc, prisma, runner } = makeDeps({ gate: 'true' });
    prisma.agentTrigger.findMany.mockResolvedValue([dueTrigger, { ...dueTrigger, id: 't2' }]);
    prisma.agentTrigger.findUnique.mockResolvedValue(dueTrigger);
    runner.execute.mockRejectedValue(new Error('agent down'));

    await expect(svc.dispatch()).resolves.toBeUndefined();
    expect(runner.execute).toHaveBeenCalledTimes(2);
  });

  it('runOnce：不存在或未启用返回 null；启用时执行且不动水位', async () => {
    const { svc, prisma, runner } = makeDeps();
    prisma.agentTrigger.findUnique.mockResolvedValue(null);
    await expect(svc.runOnce('nope')).resolves.toBeNull();

    prisma.agentTrigger.findUnique.mockResolvedValue(dueTrigger);
    const result = await svc.runOnce('t1');
    expect(result).toEqual({ runId: 'run-1', status: 'success' });
    expect(prisma.agentTrigger.updateMany).not.toHaveBeenCalled();
  });
});
