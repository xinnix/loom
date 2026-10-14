import { describe, expect, it, vi } from 'vitest';
import { AgentTriggerRunnerService } from './agent-trigger-runner.service';

describe('AgentTriggerRunnerService（泛化 run(slug)，ADR-009）', () => {
  it('以 trigger 上下文调用 runtime.run：permissions 空、userType/triggeredByType=trigger、emit 为 noop', async () => {
    const runtime = {
      run: vi.fn().mockResolvedValue({ runId: 'run-9', output: 'ok', status: 'success' }),
    };
    const runner = new AgentTriggerRunnerService(runtime as any);

    const result = await runner.execute({
      id: 't1',
      name: 'YML: todo-analyst',
      agentSlug: 'todo-analyst',
      input: { date: '2026-10-14' },
    });

    expect(result).toEqual({ runId: 'run-9', status: 'success' });
    expect(runtime.run).toHaveBeenCalledTimes(1);
    const [slug, input, ctx, emit] = runtime.run.mock.calls[0];
    expect(slug).toBe('todo-analyst');
    expect(input).toEqual({ date: '2026-10-14' });
    expect(ctx).toMatchObject({ permissions: [], userType: 'trigger', triggeredByType: 'trigger' });
    expect(typeof emit).toBe('function');
    expect(() => emit({ type: 'error', message: 'noop' })).not.toThrow();
  });

  it('input 缺省传 {}；runtime 抛错原样上抛（dispatcher 层兜底告警）', async () => {
    const runtime = { run: vi.fn().mockRejectedValue(new Error('agent boom')) };
    const runner = new AgentTriggerRunnerService(runtime as any);

    await expect(
      runner.execute({ id: 't2', name: 'x', agentSlug: 's', input: null }),
    ).rejects.toThrow('agent boom');
    expect(runtime.run.mock.calls[0][1]).toEqual({});
  });
});
