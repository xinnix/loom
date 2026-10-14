import { describe, expect, it, vi } from 'vitest';
import { CHARS_PER_TOKEN_EST, computeLlmUsageOverview } from './llm-usage-agg';

function makePrisma() {
  return {
    llmCallLog: {
      groupBy: vi.fn().mockResolvedValue([
        {
          day: '2026-10-12',
          sceneKey: 'todo-analyst',
          model: 'deepseek-chat',
          status: 'SUCCESS',
          llmConfigId: 'cfg1',
          _count: { _all: 10 },
          _sum: {
            inputTokens: 1_000_000,
            outputTokens: 200_000,
            promptChars: null,
            completionChars: null,
          },
          _avg: { latencyMs: 500 },
        },
        {
          day: '2026-10-12',
          sceneKey: 'todo-analyst',
          model: 'deepseek-chat',
          status: 'ERROR',
          llmConfigId: 'cfg1',
          _count: { _all: 5 },
          _sum: {
            inputTokens: 100_000,
            outputTokens: 20_000,
            promptChars: null,
            completionChars: null,
          },
          _avg: { latencyMs: 300 },
        },
        {
          day: '2026-10-11',
          sceneKey: null,
          model: 'other-model',
          status: 'TIMEOUT',
          llmConfigId: null,
          _count: { _all: 2 },
          _sum: { inputTokens: null, outputTokens: null, promptChars: 1600, completionChars: 320 },
          _avg: { latencyMs: null },
        },
      ]),
      findMany: vi
        .fn()
        .mockResolvedValue([{ latencyMs: 300 }, { latencyMs: 100 }, { latencyMs: 200 }]),
    },
    llmConfig: {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: 'cfg1', inputPricePer1M: 2, outputPricePer1M: 8 }]),
    },
  };
}

const settings = {
  get: (key: string) =>
    key === 'LLM_INPUT_PRICE_PER_1M' ? '1' : key === 'LLM_OUTPUT_PRICE_PER_1M' ? '4' : undefined,
} as any;

describe('computeLlmUsageOverview', () => {
  it('成本按 llmConfig 单价；无 config 回落全局兜底；无 token 按 chars 估算', async () => {
    const prisma = makePrisma();
    const r = await computeLlmUsageOverview(prisma as any, settings, 7);

    // cfg1 单价 (2, 8)：g1 = 1M×2/1e6 + 0.2M×8/1e6 = 3.6；g2 = 0.1×2 + 0.02×8 = 0.36
    // g3 全局兜底 (1, 4)：in 1600/1.6=1000 tok、out 320/1.6=200 tok → 0.001 + 0.0008 = 0.0018
    expect(r.totals.calls).toBe(17);
    expect(r.totals.errorCalls).toBe(7); // ERROR 5 + TIMEOUT 2
    expect(r.totals.cost).toBeCloseTo(3.6 + 0.36 + 0.0018, 6);
    expect(r.totals.inputTokens).toBe(1_100_000);
    expect(r.totals.outputTokens).toBe(220_000);
    expect(r.totals.errorRate).toBeCloseTo(7 / 17, 3); // 实现四舍五入 4 位小数
    expect(r.totals.latencyP50).toBe(200);
    expect(r.totals.latencyP95).toBe(300);
  });

  it('趋势按天聚合；场景维度含未归因桶；模型维度加权均值', async () => {
    const prisma = makePrisma();
    const r = await computeLlmUsageOverview(prisma as any, settings, 7);

    expect(r.trend).toHaveLength(2);
    const d12 = r.trend.find((t) => t.day === '2026-10-12')!;
    expect(d12.calls).toBe(15);

    const unattributed = r.byScene.find((s) => s.sceneKey === null)!;
    expect(unattributed.calls).toBe(2);
    const scene = r.byScene.find((s) => s.sceneKey === 'todo-analyst')!;
    expect(scene.calls).toBe(15);
    expect(scene.latencyAvg).toBe(Math.round((500 * 10 + 300 * 5) / 15));

    const m1 = r.byModel.find((m) => m.model === 'deepseek-chat')!;
    expect(m1.cost).toBeCloseTo(3.96, 6);
    expect(CHARS_PER_TOKEN_EST).toBe(1.6);
  });
});
