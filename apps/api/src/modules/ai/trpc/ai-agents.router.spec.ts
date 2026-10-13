import { describe, it, expect, beforeEach } from 'vitest';
import { createPrismaMock } from '../../../test/prisma-mock';
import { createAiAgentsRouter } from './ai-agents.router';
import { AgentsCatalogService } from '../services/agents-catalog.service';
import { AgentRunService } from '../../../ai/agents/agent-run.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';
import { ToolRegistry } from '../../../ai/tools/tool.registry';
import { ToolExecutor } from '../../../ai/tools/tool.executor';

/**
 * 框架首个 tRPC router spec（模块健康检查项）。
 * 覆盖 AI agents 只读 router：runs / getDefinition 与权限拒绝路径。
 */
describe('aiAgentsRouter', () => {
  let prisma: any;
  let caller: any;

  beforeEach(() => {
    prisma = createPrismaMock();
    const catalog = new AgentsCatalogService(prisma, new AgentRunService(prisma));
    const loader = new AgentYamlLoader(prisma, new ToolRegistry(new ToolExecutor()));
    const router = createAiAgentsRouter(catalog, loader);
    caller = router.createCaller({
      prisma,
      user: { id: 'admin-1', permissions: ['agent:read'], roles: [] },
      req: {},
    } as any);
  });

  it('runs 按slug 分页返回执行历史', async () => {
    prisma.agentRun.findMany.mockResolvedValue([
      { id: 'r1', agentSlug: 'todo-analyst', status: 'success' },
    ]);
    prisma.agentRun.count.mockResolvedValue(1);
    const result = await caller.runs({ slug: 'todo-analyst', page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(prisma.agentRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { agentSlug: 'todo-analyst' } }),
    );
  });

  it('无 agent:read 权限拒绝 runs', async () => {
    const deniedRouter = createAiAgentsRouter(
      new AgentsCatalogService(prisma, new AgentRunService(prisma)),
      new AgentYamlLoader(prisma, new ToolRegistry(new ToolExecutor())),
    );
    const deniedCaller = (deniedRouter as any).createCaller({
      prisma,
      user: { id: 'a', permissions: [], roles: [] },
      req: {},
    });
    await expect(deniedCaller.runs({ slug: 'x' })).rejects.toThrow();
  });
});
