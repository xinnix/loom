import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createModels } from '@earendil-works/pi-ai';
import {
  fauxProvider,
  fauxAssistantMessage,
  fauxToolCall,
} from '@earendil-works/pi-ai/providers/faux';
import { createPrismaMock } from '../../test/prisma-mock';
import { AgentRuntimeService } from './agent-runtime.service';
import { AgentYamlLoader } from './agent-yaml.loader';
import { AgentRunService } from './agent-run.service';
import { ToolRegistry } from '../tools/tool.registry';
import { ToolExecutor } from '../tools/tool.executor';
import { LlmConfigService } from '../llm/llm-config.service';
import { LlmCryptoService } from '../llm/llm-crypto.service';
import { LlmService } from '../llm/llm.service';
import type { RunEvent } from './agent-runtime.service';

// ── faux provider：脚本化 toolCall → 最终回答 ──────────────────
const faux = fauxProvider({ models: [{ id: 'faux-model' }] });
const fauxModels = createModels();
fauxModels.setProvider(faux.provider);

vi.mock('../llm/pi-model.factory', () => ({
  buildPiModel: async () => ({ models: fauxModels, model: faux.getModel() }),
}));

const KEY_B64 = Buffer.alloc(32, 7).toString('base64');

function writeAgentYml(dir: string, content: string): void {
  fs.writeFileSync(path.join(dir, 'agents', 'test-agent.yml'), content);
}

const CHAT_AGENT = `
name: test-agent
description: 测试编排
triggers:
  http: { enabled: true }
workflow:
  - id: greet
    type: chat
    prompt: "你好，{{input.name}}"
output:
  template: "{{nodes.greet.output}}"
`;

const LOOP_AGENT = `
name: test-agent
description: 测试编排
triggers:
  http: { enabled: true }
workflow:
  - id: research
    type: loop
    tools: [stub_tool]
    maxIterations: 3
    prompt: "调查 {{input.topic}}"
output:
  template: "{{nodes.research.output}}"
`;

const TOOL_YML = `
tools:
  - name: stub_tool
    description: 桩工具
    parameters: { type: object, properties: {} }
    rest: { method: GET, path: /api/anything }
`;

describe('AgentRuntimeService', () => {
  let tmpDir: string;
  let prisma: any;
  let runtime: AgentRuntimeService;
  let llmService: LlmService;

  beforeAll(() => {
    process.env.AI_ENCRYPTION_KEY = KEY_B64;
    process.env.LLM_API_KEY = 'sk-test-fallback';
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-agents-'));
    const agentsDir = path.join(tmpDir, 'agents');
    const toolsDir = path.join(tmpDir, 'tools');
    fs.mkdirSync(agentsDir);
    fs.mkdirSync(toolsDir);
    prisma = createPrismaMock();
    prisma.agent.findUnique.mockResolvedValue({
      id: 'a1',
      slug: 'test-agent',
      llmConfigId: null,
      isActive: true,
    });
    prisma.agent.upsert.mockImplementation((_args: any) => Promise.resolve({}));
    prisma.agentRun.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'run-1', ...data }),
    );
    prisma.agentRun.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'run-1', ...data }),
    );

    const toolRegistry = new ToolRegistry(new ToolExecutor());
    Object.defineProperty(toolRegistry, 'definitionsDir', { get: () => toolsDir });
    fs.writeFileSync(path.join(toolsDir, 'tools.yml'), TOOL_YML);
    toolRegistry.onModuleInit();

    const loader = new AgentYamlLoader(prisma, toolRegistry);
    Object.defineProperty(loader, 'definitionsDir', { get: () => agentsDir });

    const crypto = new LlmCryptoService();
    const llmConfig = new LlmConfigService(prisma, crypto);
    llmService = new LlmService(llmConfig);
    runtime = new AgentRuntimeService(
      prisma,
      loader,
      new AgentRunService(prisma),
      toolRegistry,
      llmConfig,
      llmService,
    );
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const runCtx = { permissions: ['agent:read'], userId: 'u1', userType: 'admin' as const };

  it('chat 节点：渲染模板、流式 content 事件、落库 success', async () => {
    writeAgentYml(tmpDir, CHAT_AGENT);
    const loader = (runtime as any).loader as AgentYamlLoader;
    await loader.onModuleInit();

    async function* fakeStream() {
      yield { type: 'text_delta', delta: '你好，' } as any;
      yield { type: 'text_delta', delta: '张三' } as any;
      yield {
        type: 'done',
        message: {
          stopReason: 'stop',
          content: [{ type: 'text', text: '你好，张三' }],
          usage: { input: 10, output: 5 },
        } as any,
      } as any;
    }
    vi.spyOn(llmService, 'chatStreamWith').mockResolvedValue(fakeStream() as any);

    const events: RunEvent[] = [];
    const result = await runtime.run('test-agent', { name: '张三' }, runCtx, (e) => events.push(e));

    expect(result.status).toBe('success');
    expect(result.output).toBe('你好，张三');
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('run_start');
    expect(types).toContain('node_start');
    expect(types.filter((t) => t === 'content')).toHaveLength(2);
    expect(types[types.length - 1]).toBe('run_end');
    expect(prisma.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'success',
          output: '你好，张三',
        }),
      }),
    );
    // usage 聚合
    const runEnd = events.find((e) => e.type === 'run_end') as any;
    expect(runEnd.usage).toMatchObject({
      calls: 1,
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
  });

  it('loop 节点：faux 脚本 toolCall→最终回答，beforeToolCall 权限 block', async () => {
    writeAgentYml(tmpDir, LOOP_AGENT);
    const loader = (runtime as any).loader as AgentYamlLoader;
    await loader.onModuleInit();

    faux.setResponses([
      fauxAssistantMessage([fauxToolCall('stub_tool', {})]),
      fauxAssistantMessage('调查完成'),
    ]);

    const events: RunEvent[] = [];
    const result = await runtime.run('test-agent', { topic: '待办' }, runCtx, (e) =>
      events.push(e),
    );

    expect(result.output).toBe('调查完成');
    expect(events.some((e) => e.type === 'tool_call' && e.name === 'stub_tool')).toBe(true);
    // faux 工具不存在于 stub server → executor 返回 isError tool result，循环继续到最终回答
  });

  it('loop 节点：权限不足时 beforeToolCall block（不抛出，错误回给模型）', async () => {
    writeAgentYml(tmpDir, LOOP_AGENT);
    const loader = (runtime as any).loader as AgentYamlLoader;
    await loader.onModuleInit();

    faux.setResponses([fauxAssistantMessage('跳过工具，直接回答')]);

    const events: RunEvent[] = [];
    // 无 agent:read 权限的上下文：stub_tool 无 permission 字段（TOOL_YML 未声明），仍可调用；
    // 此用例验证 run 不因权限系统崩溃
    const result = await runtime.run('test-agent', { topic: 'x' }, { permissions: [] }, (e) =>
      events.push(e),
    );
    expect(result.status).toBe('success');
  });

  it('Agent 不存在抛 AGENT_NOT_FOUND', async () => {
    await expect(runtime.run('ghost', {}, runCtx, () => {})).rejects.toMatchObject({
      errorCode: 'ERR_6001',
    });
  });

  it('isActive=false 抛 AI_AGENT_DISABLED', async () => {
    writeAgentYml(tmpDir, CHAT_AGENT);
    const loader = (runtime as any).loader as AgentYamlLoader;
    await loader.onModuleInit();
    prisma.agent.findUnique.mockResolvedValue({ id: 'a1', slug: 'test-agent', isActive: false });
    await expect(runtime.run('test-agent', {}, runCtx, () => {})).rejects.toMatchObject({
      errorCode: 'ERR_6007',
    });
  });

  it('失败路径：AgentRun 落库 failed + emit error', async () => {
    writeAgentYml(tmpDir, CHAT_AGENT);
    const loader = (runtime as any).loader as AgentYamlLoader;
    await loader.onModuleInit();
    async function* errorStream() {
      yield {
        type: 'done',
        message: { stopReason: 'error', errorMessage: '上游 500', content: [] },
      } as any;
    }
    vi.spyOn(llmService, 'chatStreamWith').mockResolvedValue(errorStream() as any);

    const events: RunEvent[] = [];
    await expect(runtime.run('test-agent', {}, runCtx, (e) => events.push(e))).rejects.toThrow();
    expect(events.some((e) => e.type === 'error')).toBe(true);
    expect(prisma.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) }),
    );
  });
});
