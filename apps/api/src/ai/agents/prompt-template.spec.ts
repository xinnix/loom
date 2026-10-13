import { describe, it, expect } from 'vitest';
import { renderTemplate } from './prompt-template';

describe('renderTemplate', () => {
  it('渲染 {{input.x}}', () => {
    const result = renderTemplate('问题：{{input.question}}', { input: { question: '今天待办' } });
    expect(result.text).toBe('问题：今天待办');
    expect(result.warnings).toHaveLength(0);
  });

  it('渲染 {{nodes.<id>.output}}', () => {
    const result = renderTemplate('草稿：{{nodes.draft.output}}', {
      nodes: { draft: '初步分析' },
    });
    expect(result.text).toBe('草稿：初步分析');
  });

  it('对象值 JSON.stringify', () => {
    const result = renderTemplate('数据：{{input.items}}', { input: { items: [1, 2] } });
    expect(result.text).toBe('数据：[1,2]');
  });

  it('未命中变量置空并记 warning', () => {
    const result = renderTemplate('值：{{input.missing}}', { input: {} });
    expect(result.text).toBe('值：');
    expect(result.warnings[0]).toContain('input.missing');
  });

  it('引用不存在的节点置空并记 warning', () => {
    const result = renderTemplate('{{nodes.ghost.output}}', { nodes: {} });
    expect(result.text).toBe('');
    expect(result.warnings[0]).toContain('nodes.ghost.output');
  });

  it('不支持 nodes.<id> 之外的子路径', () => {
    const result = renderTemplate('{{nodes.draft.foo}}', { nodes: { draft: 'x' } });
    expect(result.text).toBe('');
    expect(result.warnings).toHaveLength(1);
  });
});
