import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./pi-model.factory', () => ({
  buildPiModel: vi.fn(),
  dynamicImport: vi.fn(),
}));

import { buildPiModel } from './pi-model.factory';
import { LlmService } from './llm.service';
import type { LlmTraceService } from '../llm-trace/llm-trace.service';

const resolved = {
  id: 'cfg-1',
  configKey: 'deepseek',
  name: 'DeepSeek',
  provider: 'openai',
  apiUrl: 'https://api.deepseek.com/v1',
  apiKey: 'sk-test',
  model: 'deepseek-chat',
  timeoutMs: 60_000,
  maxRetries: 1,
};

const okMessage = {
  stopReason: 'stop',
  usage: { input: 120, output: 80 },
  durationMs: 456,
  errorMessage: undefined,
  content: [{ type: 'text' as const, text: '答案' }],
} as any;

function makeService() {
  const record = vi.fn();
  const trace = { record } as unknown as LlmTraceService;
  const svc = new LlmService({} as any, trace);
  return { svc, record };
}

describe('LlmService 用量埋点（ADR-007 golden：埋点零行为改变）', () => {
  beforeEach(() => vi.clearAllMocks());

  it('无 trace meta → 完全不埋点，返回值不变（存量行为）', async () => {
    const complete = vi.fn().mockResolvedValue(okMessage);
    (buildPiModel as any).mockResolvedValue({ models: { complete }, model: {} });
    const svc = new LlmService({} as any);

    const message = await svc.chatWith(resolved as any, {
      messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }] as any,
    });
    expect(message).toBe(okMessage);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('chatWith 带 trace → 恰好一次 record，字段含 usage/归因', async () => {
    const complete = vi.fn().mockResolvedValue(okMessage);
    (buildPiModel as any).mockResolvedValue({ models: { complete }, model: {} });
    const { svc, record } = makeService();

    await svc.chatWith(resolved as any, {
      messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }] as any,
      trace: { traceId: 'run-1', sceneKey: 'todo-analyst' },
    });
    expect(record).toHaveBeenCalledTimes(1);
    const draft = record.mock.calls[0][0];
    expect(draft).toMatchObject({
      traceId: 'run-1',
      sceneKey: 'todo-analyst',
      llmConfigId: 'cfg-1',
      callType: 'CHAT',
      model: 'deepseek-chat',
      status: 'SUCCESS',
      inputTokens: 120,
      outputTokens: 80,
      latencyMs: 456,
    });
    expect(draft.promptChars).toBe(2); // "hi"
  });

  it('chatWith 错误终态（stopReason=error）→ 先记 ERROR 流水再抛业务异常', async () => {
    const badMessage = { ...okMessage, stopReason: 'error', errorMessage: 'provider boom' };
    const complete = vi.fn().mockResolvedValue(badMessage);
    (buildPiModel as any).mockResolvedValue({ models: { complete }, model: {} });
    const { svc, record } = makeService();

    await expect(
      svc.chatWith(resolved as any, {
        messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }] as any,
        trace: { traceId: 'run-1' },
      }),
    ).rejects.toThrow('provider boom');
    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0][0].status).toBe('ERROR');
  });

  it('chatWith 网络抛错 → ERROR 流水 + 原样重抛', async () => {
    const complete = vi.fn().mockRejectedValue(new Error('fetch failed: 503'));
    (buildPiModel as any).mockResolvedValue({ models: { complete }, model: {} });
    const { svc, record } = makeService();

    await expect(
      svc.chatWith(resolved as any, {
        messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }] as any,
        trace: { traceId: 'run-1' },
      }),
    ).rejects.toThrow('503');
    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0][0]).toMatchObject({
      status: 'ERROR',
      errorClass: 'http_5xx',
    });
  });

  it('chatStreamWith 带 trace → 旁听 result() 落一条 CHAT_STREAM，流原样返回', async () => {
    const stream = {
      result: () => Promise.resolve(okMessage),
      [Symbol.asyncIterator]() {
        return { next: async () => ({ done: true, value: undefined }) };
      },
    };
    const streamFn = vi.fn().mockReturnValue(stream);
    (buildPiModel as any).mockResolvedValue({ models: { stream: streamFn }, model: {} });
    const { svc, record } = makeService();

    const returned = await svc.chatStreamWith(resolved as any, {
      messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }] as any,
      trace: { traceId: 'run-1', sceneKey: 'todo-analyst' },
    });
    expect(returned).toBe(stream);
    await vi.waitFor(() => expect(record).toHaveBeenCalledTimes(1));
    expect(record.mock.calls[0][0]).toMatchObject({
      callType: 'CHAT_STREAM',
      traceId: 'run-1',
      status: 'SUCCESS',
      inputTokens: 120,
    });
  });

  it('chatStreamWith 无 trace meta → 不产生任何埋点', async () => {
    const stream = { result: () => Promise.resolve(okMessage) };
    const streamFn = vi.fn().mockReturnValue(stream);
    (buildPiModel as any).mockResolvedValue({ models: { stream: streamFn }, model: {} });
    const { svc, record } = makeService();

    const returned = await svc.chatStreamWith(resolved as any, {
      messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }] as any,
    });
    expect(returned).toBe(stream);
    await Promise.resolve();
    expect(record).not.toHaveBeenCalled();
  });
});
