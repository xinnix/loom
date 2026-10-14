import { describe, expect, it } from 'vitest';
import { ChangelogReader } from './changelog.reader';

const SAMPLE = `# 更新日志

导语段落应被忽略。

## [0.2.0] - 2026-10-14

### 新增

- 新能力甲
- 新能力乙

### 修复

- 缺陷一

## [0.1.0] - 2026-10-13

### Added

- english alias item

### 未知节

- 这条应被忽略

### 变更

- 初始化基座

## [broken] - 不是日期

### 新增

- 这节整体校验失败被跳过
`;

describe('ChangelogReader.parse（ADR-010 约束格式）', () => {
  it('解析版本节、类型分组与条目；中英文别名归一', () => {
    const entries = new ChangelogReader().parse(SAMPLE);
    expect(entries).toHaveLength(2); // broken 节被跳过

    const v02 = entries[0];
    expect(v02.version).toBe('0.2.0');
    expect(v02.date).toBe('2026-10-14');
    expect(v02.groups).toEqual([
      { type: 'added', items: ['新能力甲', '新能力乙'] },
      { type: 'fixed', items: ['缺陷一'] },
    ]);

    const v01 = entries[1];
    expect(v01.groups).toEqual([
      { type: 'added', items: ['english alias item'] },
      { type: 'changed', items: ['初始化基座'] },
    ]);
  });

  it('空内容与无版本节返回空数组', () => {
    const reader = new ChangelogReader();
    expect(reader.parse('')).toEqual([]);
    expect(reader.parse('# 只有标题\n\n正文没有版本节')).toEqual([]);
  });

  it('日期缺失的版本节校验失败被跳过（不整页失败）', () => {
    const entries = new ChangelogReader().parse('## [x] - nope\n\n### 新增\n- item\n');
    expect(entries).toEqual([]);
  });
});
