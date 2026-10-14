import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsService } from './settings.service';

function makePrisma(rows: { key: string; value: string; isSecret: boolean; group: string }[] = []) {
  return {
    systemSetting: {
      findMany: vi.fn(async () => rows),
      upsert: vi.fn(async ({ where, update }: any) => ({ key: where.key, ...update })),
    },
    $transaction: vi.fn(async (ops: Promise<any>[]) => Promise.all(ops)),
  } as any;
}

async function makeService(rows: Parameters<typeof makePrisma>[0] = []) {
  const prisma = makePrisma(rows);
  const service = new SettingsService(prisma);
  await service.onModuleInit();
  return { service, prisma };
}

describe('SettingsService（ADR-008 机制）', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('DB 值优先于 env', async () => {
    vi.stubEnv('LLM_MODEL', 'env-model');
    const { service } = await makeService([
      { key: 'LLM_MODEL', value: 'db-model', isSecret: false, group: 'llm' },
    ]);
    expect(service.get('LLM_MODEL')).toBe('db-model');
    expect(service.getSource('LLM_MODEL')).toBe('db');
  });

  it('DB 无值时回落 env；全无返回 undefined', async () => {
    vi.stubEnv('LLM_MODEL', 'env-model');
    const { service } = await makeService();
    expect(service.get('LLM_MODEL')).toBe('env-model');
    expect(service.getSource('LLM_MODEL')).toBe('env');
    expect(service.get('LLM_INPUT_PRICE_PER_1M')).toBeUndefined();
    expect(service.getSource('LLM_INPUT_PRICE_PER_1M')).toBe('none');
  });

  it('setMany：空值/null 表示留空不修改，目录外键被白名单过滤', async () => {
    const { service, prisma } = await makeService([
      { key: 'LLM_API_KEY', value: 'old-key', isSecret: true, group: 'llm' },
    ]);
    await service.setMany('llm', {
      LLM_API_URL: 'https://api.new.com/v1',
      LLM_API_KEY: '',
      LLM_MODEL: null,
      NOT_IN_CATALOG: 'x',
    } as any);

    const upsertKeys = prisma.systemSetting.upsert.mock.calls.map((c: any[]) => c[0].where.key);
    expect(upsertKeys).toEqual(['LLM_API_URL']);
    // 写后 reload 且 version 递增
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(service.getVersion()).toBeGreaterThan(0);
    expect(service.get('LLM_API_KEY')).toBe('old-key');
  });

  it('setMany 未知分组抛错', async () => {
    const { service } = await makeService();
    await expect(service.setMany('nope', {})).rejects.toThrow(/未知的配置分组/);
  });

  it('getGroupView：敏感值脱敏、非敏感值回传明文', async () => {
    const { service } = await makeService([
      { key: 'LLM_API_KEY', value: 'sk-secret-key-123', isSecret: true, group: 'llm' },
      { key: 'LLM_MODEL', value: 'deepseek-chat', isSecret: false, group: 'llm' },
    ]);
    const view = service.getGroupView('llm');
    const keyField = view.find((f) => f.key === 'LLM_API_KEY')!;
    const modelField = view.find((f) => f.key === 'LLM_MODEL')!;
    expect(keyField.isSet).toBe(true);
    expect(keyField.maskedValue).toBe('sk-s****');
    expect(keyField.value).toBeUndefined();
    expect(modelField.value).toBe('deepseek-chat');
  });

  it('onModuleInit 失败不抛错（env 兜底）', async () => {
    const prisma = {
      systemSetting: {
        findMany: vi.fn(async () => {
          throw new Error('db down');
        }),
      },
    } as any;
    const service = new SettingsService(prisma);
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    vi.stubEnv('LLM_MODEL', 'env-fallback');
    expect(service.get('LLM_MODEL')).toBe('env-fallback');
    expect(service.isLoaded()).toBe(false);
  });
});
