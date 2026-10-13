import { describe, expect, it } from 'vitest';
import { AgentYmlSchema, ToolFileYmlSchema } from './yml-schemas';

const validAgent = {
  name: 'todo-analyst',
  description: '分析待办',
  triggers: {
    http: { enabled: true },
    cron: { enabled: false, expression: '0 9 * * 1-5' },
  },
  workflow: [
    { id: 'draft', type: 'chat', prompt: '分析：{{input.question}}' },
    {
      id: 'research',
      type: 'loop',
      maxIterations: 5,
      tools: ['todo_stats'],
      prompt: '核实：{{nodes.draft.output}}',
    },
  ],
  output: { template: '{{nodes.research.output}}' },
};

describe('AgentYmlSchema', () => {
  it('接受合法的编排文件', () => {
    const result = AgentYmlSchema.safeParse(validAgent);
    expect(result.success).toBe(true);
  });

  it('拒绝空 workflow', () => {
    const result = AgentYmlSchema.safeParse({ ...validAgent, workflow: [] });
    expect(result.success).toBe(false);
  });

  it('拒绝重复节点 id', () => {
    const result = AgentYmlSchema.safeParse({
      ...validAgent,
      workflow: [
        { id: 'a', type: 'chat', prompt: 'x' },
        { id: 'a', type: 'chat', prompt: 'y' },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('节点 id 重复'))).toBe(true);
    }
  });

  it('loop 节点必填 maxIterations', () => {
    const result = AgentYmlSchema.safeParse({
      ...validAgent,
      workflow: [{ id: 'a', type: 'loop', prompt: 'x' }],
    });
    expect(result.success).toBe(false);
  });

  it('拒绝引用不存在的节点', () => {
    const result = AgentYmlSchema.safeParse({
      ...validAgent,
      workflow: [{ id: 'a', type: 'chat', prompt: '{{nodes.ghost.output}}' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('不存在的节点'))).toBe(true);
    }
  });

  it('拒绝前向引用（仅允许引用更早的节点）', () => {
    const result = AgentYmlSchema.safeParse({
      ...validAgent,
      workflow: [
        { id: 'a', type: 'chat', prompt: '{{nodes.b.output}}' },
        { id: 'b', type: 'chat', prompt: 'x' },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('非前置节点'))).toBe(true);
    }
  });

  it('output 模板引用不存在的节点时报错', () => {
    const result = AgentYmlSchema.safeParse({
      ...validAgent,
      output: { template: '{{nodes.ghost.output}}' },
    });
    expect(result.success).toBe(false);
  });

  it('cron 启用时必须提供 expression', () => {
    const result = AgentYmlSchema.safeParse({
      ...validAgent,
      triggers: { cron: { enabled: true } },
    });
    expect(result.success).toBe(false);
  });

  it('拒绝非法 name 格式', () => {
    const result = AgentYmlSchema.safeParse({ ...validAgent, name: 'Invalid Name!' });
    expect(result.success).toBe(false);
  });
});

describe('ToolFileYmlSchema', () => {
  const validTool = {
    tools: [
      {
        name: 'todo_stats',
        description: '统计待办数量',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['open', 'done'], description: '按状态过滤' },
          },
          required: ['status'],
        },
        permission: 'agent:read',
        rest: { method: 'GET', path: '/api/todos/stats', paramPlacement: 'query' },
      },
    ],
  };

  it('接受合法的工具文件', () => {
    const result = ToolFileYmlSchema.safeParse(validTool);
    expect(result.success).toBe(true);
  });

  it('拒绝非 /api/ 开头的路径', () => {
    const result = ToolFileYmlSchema.safeParse({
      tools: [
        {
          ...validTool.tools[0],
          rest: { method: 'GET', path: 'https://evil.example.com/api/x' },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('拒绝白名单外的 method', () => {
    const result = ToolFileYmlSchema.safeParse({
      tools: [
        {
          ...validTool.tools[0],
          rest: { method: 'DELETE', path: '/api/todos/1' },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('拒绝重名工具', () => {
    const result = ToolFileYmlSchema.safeParse({
      tools: [validTool.tools[0], validTool.tools[0]],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('工具重名'))).toBe(true);
    }
  });

  it('拒绝未知参数类型（JSON Schema 子集外）', () => {
    const result = ToolFileYmlSchema.safeParse({
      tools: [
        {
          ...validTool.tools[0],
          parameters: { type: 'object', properties: { x: { type: 'function' } } },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('支持嵌套数组参数', () => {
    const result = ToolFileYmlSchema.safeParse({
      tools: [
        {
          ...validTool.tools[0],
          parameters: {
            type: 'object',
            properties: {
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
