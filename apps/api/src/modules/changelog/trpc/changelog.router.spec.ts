import { describe, expect, it, vi } from 'vitest';
import { changelogRouter } from './changelog.router';
import { createCaller } from '../../../test/prisma-mock';

// 覆盖 reader 的文件读取，注入固定条目（router 层只测过滤逻辑）
const sample = [
  {
    version: '0.2.0',
    date: '2026-10-14',
    groups: [
      { type: 'added', items: ['LLM 用量看板', '平台参数中心'] },
      { type: 'fixed', items: ['登录缺陷'] },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-10-13',
    groups: [{ type: 'added', items: ['初始基座'] }],
  },
];

vi.mock('../changelog.reader', async () => {
  const actual = await vi.importActual<typeof import('../changelog.reader')>('../changelog.reader');
  return {
    ...(actual as object),
    ChangelogReader: class {
      getEntries = vi.fn(() => sample);
    },
  };
});

describe('changelog.router（过滤逻辑）', () => {
  it('无过滤返回全量', async () => {
    const { caller } = createCaller(changelogRouter, { user: { permissions: ['changelog:read'] } });
    const entries = await caller.getEntries();
    expect(entries).toHaveLength(2);
  });

  it('按类型过滤：只剩含该类型组的版本', async () => {
    const { caller } = createCaller(changelogRouter, { user: { permissions: ['changelog:read'] } });
    const entries = await caller.getEntries({ type: 'fixed' });
    expect(entries).toHaveLength(1);
    expect(entries[0].groups).toEqual([{ type: 'fixed', items: ['登录缺陷'] }]);
  });

  it('关键字过滤：条目级命中；版本号命中保留整节', async () => {
    const { caller } = createCaller(changelogRouter, { user: { permissions: ['changelog:read'] } });
    const byItem = await caller.getEntries({ keyword: '看板' });
    expect(byItem[0].groups[0].items).toEqual(['LLM 用量看板']);

    const byVersion = await caller.getEntries({ keyword: '0.1.0' });
    expect(byVersion).toHaveLength(1);
    expect(byVersion[0].groups[0].items).toHaveLength(1);
  });

  it('无权限抛 FORBIDDEN', async () => {
    const { caller } = createCaller(changelogRouter, { user: { permissions: [] } });
    await expect(caller.getEntries()).rejects.toThrow(/Missing permission/);
  });
});
