import { PrismaService } from '../../prisma/prisma.service';

/**
 * LLM 用量聚合（纯函数，ADR-007）：
 * 单条 groupBy(day/sceneKey/model/status/llmConfigId) + JS 透视出总览/趋势/场景/模型四维度；
 * 成本 = Σ(token/1e6 × 单价)，单价链 llmConfigId → LlmConfig → 全局兜底键；
 * 无 token 时按 chars/CHARS_PER_TOKEN_EST 估算。定位归因而非计费（±10%）。
 */

/** 价格兜底键读取方（Settings 参数中心就位前为 env 直读适配器，届时无缝切换） */
export interface LlmUsageSettingsLike {
  get(key: string): string | undefined;
}

/** 无 usage 时的 token 估算系数（中文为主口径；chars 与真实 token 恒同行记录，可回溯校准） */
export const CHARS_PER_TOKEN_EST = 1.6;

export interface LlmUsagePrice {
  pIn: number;
  pOut: number;
}

export interface LlmUsageTotals {
  calls: number;
  errorCalls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  errorRate: number;
  latencyP50: number | null;
  latencyP95: number | null;
}

export interface LlmUsageTrendPoint {
  day: string;
  calls: number;
  errorCalls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface LlmUsageSceneRow {
  sceneKey: string | null;
  calls: number;
  errorCalls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyAvg: number | null;
}

export interface LlmUsageModelRow {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyAvg: number | null;
}

export interface LlmUsageOverview {
  since: string;
  until: string;
  totals: LlmUsageTotals;
  trend: LlmUsageTrendPoint[];
  byScene: LlmUsageSceneRow[];
  byModel: LlmUsageModelRow[];
}

type UsageGroup = {
  day: string;
  sceneKey: string | null;
  model: string;
  status: string;
  llmConfigId: string | null;
  _count: { _all: number };
  _sum: {
    inputTokens: number | null;
    outputTokens: number | null;
    promptChars: number | null;
    completionChars: number | null;
  };
  _avg: { latencyMs: number | null };
};

const round4 = (n: number) => Math.round(n * 10000) / 10000;

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

/** 单价表：一次 LlmConfig 查询 + 全局兜底键（元/百万 tokens；均空 = 0 不计成本） */
async function loadPriceMap(prisma: PrismaService, settings: LlmUsageSettingsLike) {
  const [configs, gIn, gOut] = await Promise.all([
    prisma.llmConfig.findMany({
      select: { id: true, inputPricePer1M: true, outputPricePer1M: true },
    }),
    Promise.resolve(Number(settings.get('LLM_INPUT_PRICE_PER_1M')) || 0),
    Promise.resolve(Number(settings.get('LLM_OUTPUT_PRICE_PER_1M')) || 0),
  ]);
  return {
    byConfig: new Map<string, LlmUsagePrice>(
      configs.map((c) => [
        c.id,
        { pIn: c.inputPricePer1M ?? gIn, pOut: c.outputPricePer1M ?? gOut },
      ]),
    ),
    global: { pIn: gIn, pOut: gOut } satisfies LlmUsagePrice,
  };
}

function rowCost(row: UsageGroup, priceMap: Awaited<ReturnType<typeof loadPriceMap>>): number {
  const prices =
    (row.llmConfigId ? priceMap.byConfig.get(row.llmConfigId) : undefined) ?? priceMap.global;
  // 无 token 的组按 chars 估算（同组混合时以 token 优先，估算仅兜底，±10% 归因口径）
  const inTok =
    row._sum.inputTokens ?? (row._sum.promptChars ? row._sum.promptChars / CHARS_PER_TOKEN_EST : 0);
  const outTok =
    row._sum.outputTokens ??
    (row._sum.completionChars ? row._sum.completionChars / CHARS_PER_TOKEN_EST : 0);
  return (inTok / 1e6) * prices.pIn + (outTok / 1e6) * prices.pOut;
}

export async function computeLlmUsageOverview(
  prisma: PrismaService,
  settings: LlmUsageSettingsLike,
  days: 7 | 14 | 30,
): Promise<LlmUsageOverview> {
  const until = new Date();
  const since = new Date(until.getTime() - days * 86_400_000);

  const [groups, latencyRows, priceMap] = await Promise.all([
    prisma.llmCallLog.groupBy({
      by: ['day', 'sceneKey', 'model', 'status', 'llmConfigId'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, promptChars: true, completionChars: true },
      _avg: { latencyMs: true },
    }),
    prisma.llmCallLog.findMany({
      where: { createdAt: { gte: since }, latencyMs: { not: null } },
      select: { latencyMs: true },
    }),
    loadPriceMap(prisma, settings),
  ]);

  // ── JS 透视 ──
  const totals: LlmUsageTotals = {
    calls: 0,
    errorCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    errorRate: 0,
    latencyP50: null,
    latencyP95: null,
  };
  const trendMap = new Map<string, LlmUsageTrendPoint>();
  const sceneMap = new Map<string, LlmUsageSceneRow>();
  const modelMap = new Map<string, LlmUsageModelRow>();

  const latencyAvg = (sum: number, n: number) => (n ? Math.round(sum / n) : null);

  for (const g of groups as UsageGroup[]) {
    const n = g._count._all;
    const isError = g.status === 'ERROR' || g.status === 'TIMEOUT';
    const cost = rowCost(g, priceMap);
    const lat = g._avg.latencyMs ?? null;

    totals.calls += n;
    if (isError) totals.errorCalls += n;
    totals.inputTokens += g._sum.inputTokens ?? 0;
    totals.outputTokens += g._sum.outputTokens ?? 0;
    totals.cost += cost;

    const t = trendMap.get(g.day) ?? {
      day: g.day,
      calls: 0,
      errorCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
    };
    t.calls += n;
    if (isError) t.errorCalls += n;
    t.inputTokens += g._sum.inputTokens ?? 0;
    t.outputTokens += g._sum.outputTokens ?? 0;
    t.cost += cost;
    trendMap.set(g.day, t);

    const sceneKey = g.sceneKey ?? '(未归因)';
    const s = sceneMap.get(sceneKey) ?? {
      sceneKey: g.sceneKey,
      calls: 0,
      errorCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      latencyAvg: null,
    };
    s.calls += n;
    if (isError) s.errorCalls += n;
    s.inputTokens += g._sum.inputTokens ?? 0;
    s.outputTokens += g._sum.outputTokens ?? 0;
    s.cost += cost;
    if (lat != null) {
      // 组内均值 × 组行数 加权回总均值
      const prevSum = (s.latencyAvg ?? 0) * (s.calls - n);
      s.latencyAvg = latencyAvg(prevSum + lat * n, s.calls);
    }
    sceneMap.set(sceneKey, s);

    const m = modelMap.get(g.model) ?? {
      model: g.model,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      latencyAvg: null,
    };
    m.calls += n;
    m.inputTokens += g._sum.inputTokens ?? 0;
    m.outputTokens += g._sum.outputTokens ?? 0;
    m.cost += cost;
    if (lat != null) {
      const prevSum = (m.latencyAvg ?? 0) * (m.calls - n);
      m.latencyAvg = latencyAvg(prevSum + lat * n, m.calls);
    }
    modelMap.set(g.model, m);
  }

  const latencies = latencyRows.map((r) => r.latencyMs as number).sort((a, b) => a - b);
  totals.latencyP50 = percentile(latencies, 0.5);
  totals.latencyP95 = percentile(latencies, 0.95);
  totals.errorRate = totals.calls
    ? Math.round((totals.errorCalls / totals.calls) * 10000) / 10000
    : 0;
  totals.cost = round4(totals.cost);

  const byScene = [...sceneMap.values()]
    .map((s) => ({ ...s, cost: round4(s.cost) }))
    .sort((a, b) => b.cost - a.cost || b.calls - a.calls);
  const byModel = [...modelMap.values()]
    .map((m) => ({ ...m, cost: round4(m.cost) }))
    .sort((a, b) => b.cost - a.cost || b.calls - a.calls);
  const trend = [...trendMap.values()]
    .map((t) => ({ ...t, cost: round4(t.cost) }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return {
    since: since.toISOString(),
    until: until.toISOString(),
    totals,
    trend,
    byScene,
    byModel,
  };
}
