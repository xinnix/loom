import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dayBucketUtc8, traceLlmStream, LlmTraceService } from './llm-trace.service';

function createService(env: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const prisma = {
    llmCallLog: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
  return { svc: new LlmTraceService(prisma as any), prisma };
}

const baseDraft = {
  callType: 'CHAT' as const,
  model: 'deepseek-chat',
  status: 'SUCCESS' as const,
  latencyMs: 100,
};

describe('dayBucketUtc8', () => {
  it('按 UTC+8 落桶：15:59Z 与 16:00Z 分属两天', () => {
    expect(dayBucketUtc8(new Date('2026-10-12T15:59:59Z'))).toBe('2026-10-12');
    expect(dayBucketUtc8(new Date('2026-10-12T16:00:00Z'))).toBe('2026-10-13');
  });
});

describe('LlmTraceService', () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.unstubAllEnvs());

  it('record 暂存缓冲，flush 批量 createMany 并补 traceId/day', async () => {
    const { svc, prisma } = createService();
    svc.record({ ...baseDraft, traceId: 'run-1', sceneKey: 'todo-analyst' });
    expect(prisma.llmCallLog.createMany).not.toHaveBeenCalled();

    await svc.flush();
    expect(prisma.llmCallLog.createMany).toHaveBeenCalledTimes(1);
    const batch = prisma.llmCallLog.createMany.mock.calls[0][0].data;
    expect(batch).toHaveLength(1);
    expect(batch[0].traceId).toBe('run-1');
    expect(batch[0].sceneKey).toBe('todo-analyst');
    expect(batch[0].day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('traceId 缺省自动补 uuid', async () => {
    const { svc, prisma } = createService();
    svc.record(baseDraft);
    await svc.flush();
    expect(prisma.llmCallLog.createMany.mock.calls[0][0].data[0].traceId).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });

  it('errorMsg 截 200 字', async () => {
    const { svc, prisma } = createService();
    svc.record({ ...baseDraft, status: 'ERROR', errorClass: 'unknown', errorMsg: 'x'.repeat(500) });
    await svc.flush();
    expect(prisma.llmCallLog.createMany.mock.calls[0][0].data[0].errorMsg).toHaveLength(200);
  });

  it('采样：SUCCESS 按率丢弃，ERROR 恒记录', async () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { svc, prisma } = createService({ LLM_TRACE_SAMPLE_RATE: '0.4' });
    svc.record({ ...baseDraft }); // 0.5 >= 0.4 → 丢弃
    svc.record({ ...baseDraft, status: 'ERROR', errorClass: 'http_5xx', errorMsg: 'boom' }); // 恒记录
    await svc.flush();
    const batch = prisma.llmCallLog.createMany.mock.calls[0][0].data;
    expect(batch).toHaveLength(1);
    expect(batch[0].status).toBe('ERROR');
    rnd.mockRestore();
  });

  it('flush 失败只丢弃不 throw；可继续接收后续记录', async () => {
    const { svc, prisma } = createService();
    prisma.llmCallLog.createMany.mockRejectedValueOnce(new Error('db down'));
    svc.record({ ...baseDraft, traceId: 't-1' });
    await expect(svc.flush()).resolves.toBeUndefined(); // 不抛
    svc.record({ ...baseDraft, traceId: 't-2' }); // 缓冲仍可用
    await svc.flush();
    expect(prisma.llmCallLog.createMany).toHaveBeenCalledTimes(2);
  });

  it('背压：DB 挂起时缓冲封顶 MAX_PENDING，超额丢弃', async () => {
    const { svc, prisma } = createService();
    prisma.llmCallLog.createMany.mockReturnValue(new Promise(() => {})); // 永不完成
    for (let i = 0; i < 5200; i++) svc.record({ ...baseDraft, traceId: `t-${i}` });
    // 前 50 条进入进行中的 flush，其后补位到 5000 上限
    expect(svc['active'].length).toBeLessThanOrEqual(5000);
  });

  it('purgeRetention：删 30 天前明细', async () => {
    const { svc, prisma } = createService();
    const before = Date.now();
    await svc.purgeRetention();
    const arg = prisma.llmCallLog.deleteMany.mock.calls[0][0].where.createdAt.lt.getTime();
    const days = (before - arg) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });
});

describe('traceLlmStream（旁听 result() 落流水）', () => {
  const record = vi.fn();
  const base = { callType: 'AGENT_LOOP' as const, model: 'deepseek-chat' };

  function fakeStream(result: Promise<unknown>) {
    return { result: () => result } as any;
  }

  it('SUCCESS：透传流并记录 usage/延迟', async () => {
    record.mockClear();
    const msg = {
      stopReason: 'stop',
      usage: { input: 100, output: 50 },
      durationMs: 123,
      content: [{ type: 'text', text: 'abc' }],
    };
    const stream = fakeStream(Promise.resolve(msg));
    const returned = traceLlmStream(stream, base, record);
    expect(returned).toBe(stream); // 不改写、不包装返回值
    await vi.waitFor(() => expect(record).toHaveBeenCalledTimes(1));
    const draft = record.mock.calls[0][0];
    expect(draft.status).toBe('SUCCESS');
    expect(draft.inputTokens).toBe(100);
    expect(draft.outputTokens).toBe(50);
    expect(draft.completionChars).toBe(3);
    expect(draft.latencyMs).toBe(123);
  });

  it('stopReason=error → ERROR 并截 errorMsg', async () => {
    record.mockClear();
    const msg = { stopReason: 'error', errorMessage: 'x'.repeat(300), content: [] };
    traceLlmStream(fakeStream(Promise.resolve(msg)), base, record);
    await vi.waitFor(() => expect(record).toHaveBeenCalledTimes(1));
    const draft = record.mock.calls[0][0];
    expect(draft.status).toBe('ERROR');
    expect(draft.errorMsg).toHaveLength(200);
  });

  it('stopReason=aborted → ABORTED', async () => {
    record.mockClear();
    traceLlmStream(
      fakeStream(Promise.resolve({ stopReason: 'aborted', content: [] })),
      base,
      record,
    );
    await vi.waitFor(() => expect(record).toHaveBeenCalledTimes(1));
    expect(record.mock.calls[0][0].status).toBe('ABORTED');
  });

  it('result() 拒绝 → ERROR + classify', async () => {
    record.mockClear();
    const err = new Error('Request timed out after 60000ms');
    traceLlmStream(fakeStream(Promise.reject(err)), base, record);
    await vi.waitFor(() => expect(record).toHaveBeenCalledTimes(1));
    const draft = record.mock.calls[0][0];
    expect(draft.status).toBe('TIMEOUT');
    expect(draft.errorClass).toBe('timeout');
  });
});
