import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPrismaMock } from '../../../test/prisma-mock';
import { AgentSessionService } from './agent-session.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';
import { ToolRegistry } from '../../../ai/tools/tool.registry';
import { ToolExecutor } from '../../../ai/tools/tool.executor';

/** BusinessException 的 statusCode 走 getStatus()，辅助断言错误码 + HTTP 状态 */
async function expectBiz(p: Promise<unknown>, code: string, status: number) {
  const err: any = await p.then(
    () => {
      throw new Error('should have rejected');
    },
    (e) => e,
  );
  expect(err.errorCode).toBe(code);
  expect(err.getStatus()).toBe(status);
}

describe('AgentSessionService', () => {
  let prisma: any;
  let service: AgentSessionService;

  beforeEach(() => {
    prisma = createPrismaMock();
    const toolRegistry = new ToolRegistry(new ToolExecutor());
    const loader = new AgentYamlLoader(prisma, toolRegistry);
    // 直接注入内存定义：chat-agent（all）/ admin-only（admin）
    vi.spyOn(loader, 'get').mockImplementation((slug: string) => {
      if (slug === 'chat-agent') return { name: slug, audience: 'all' } as any;
      if (slug === 'admin-only') return { name: slug, audience: 'admin' } as any;
      return undefined;
    });
    service = new AgentSessionService(prisma, loader);
  });

  it('assertUserType：admin 调用 403（会话仅用户端）', () => {
    expect(() => service.assertUserType('admin')).toThrow();
    expect(() => service.assertUserType('user')).not.toThrow();
    expect(() => service.assertUserType(undefined)).toThrow();
  });

  it('create：audience=admin 的 agent 拒绝建会话', async () => {
    await expectBiz(service.create('u1', 'admin-only'), 'ERR_6009', 403);
  });

  it('create：不存在的 agent 404', async () => {
    await expectBiz(service.create('u1', 'ghost'), 'ERR_6001', 404);
  });

  it('create：audience 开放 + isActive 正常创建', async () => {
    prisma.agent.findUnique.mockResolvedValue({ id: 'a1', slug: 'chat-agent', isActive: true });
    prisma.agentSession.create.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      agentSlug: 'chat-agent',
    });
    const session = await service.create('u1', 'chat-agent');
    expect(session.id).toBe('s1');
    expect(prisma.agentSession.create).toHaveBeenCalledWith({
      data: { userId: 'u1', agentSlug: 'chat-agent' },
    });
  });

  it('create：isActive=false 拒绝', async () => {
    prisma.agent.findUnique.mockResolvedValue({ id: 'a1', slug: 'chat-agent', isActive: false });
    await expectBiz(service.create('u1', 'chat-agent'), 'ERR_6007', 409);
  });

  it('getWithMessages：非本人会话返回 404（不泄露存在性）', async () => {
    prisma.agentSession.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'other',
      agentSlug: 'chat-agent',
    });
    await expectBiz(service.getWithMessages('u1', 's1'), 'ERR_6008', 404);
  });

  it('getWithMessages：本人会话返回消息（正序）', async () => {
    prisma.agentSession.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      agentSlug: 'chat-agent',
    });
    prisma.agentMessage.findMany.mockResolvedValue([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]);
    const result = await service.getWithMessages('u1', 's1');
    expect(result.messages).toHaveLength(2);
    expect(prisma.agentMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sessionId: 's1' }, orderBy: { createdAt: 'asc' } }),
    );
  });

  it('beginTurn：写用户消息、生成 title、返回最近 20 条历史（正序、不含当前消息）', async () => {
    prisma.agentSession.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      agentSlug: 'chat-agent',
      title: null,
    });
    // desc 序（最新在前），msg-24 为刚写入的当前消息；模拟 skip/take 语义
    const allDesc = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg-${i}`,
    })).reverse();
    prisma.agentMessage.findMany.mockImplementation(({ skip = 0, take }: any) =>
      Promise.resolve(allDesc.slice(skip, take ? skip + take : undefined)),
    );

    const { history } = await service.beginTurn('u1', 's1', 'chat-agent', '新问题');

    // $transaction 两个操作：写消息 + 更新 title/lastMessageAt
    expect(prisma.agentMessage.create).toHaveBeenCalledWith({
      data: { sessionId: 's1', role: 'user', content: '新问题' },
    });
    expect(prisma.agentSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: '新问题' }) }),
    );
    // skip 1（当前消息）take 20（上限），reverse 后正序：最早在前
    expect(history).toHaveLength(20);
    expect(history[0].content).toBe('msg-4');
    expect(history[19].content).toBe('msg-23');
  });

  it('beginTurn：会话与 agent 不一致 400', async () => {
    prisma.agentSession.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      agentSlug: 'chat-agent',
      title: 't',
    });
    await expectBiz(service.beginTurn('u1', 's1', 'other-agent', 'x'), 'ERR_6009', 400);
  });

  it('beginTurn：已有 title 不覆盖', async () => {
    prisma.agentSession.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      agentSlug: 'chat-agent',
      title: '已有标题',
    });
    prisma.agentMessage.findMany.mockResolvedValue([]);
    await service.beginTurn('u1', 's1', 'chat-agent', '新问题');
    const update = prisma.agentSession.update.mock.calls[0][0];
    expect(update.data.title).toBeUndefined();
  });

  it('endTurn：写 assistant 消息（关联 runId）+ 推进排序键', async () => {
    await service.endTurn('s1', 'run-9', '回答内容');
    expect(prisma.agentMessage.create).toHaveBeenCalledWith({
      data: { sessionId: 's1', role: 'assistant', content: '回答内容', runId: 'run-9' },
    });
    expect(prisma.agentSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 's1' } }),
    );
  });

  it('list：强制 userId 隔离', async () => {
    prisma.agentSession.findMany.mockResolvedValue([]);
    await service.list('u1', 'chat-agent');
    expect(prisma.agentSession.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', agentSlug: 'chat-agent' },
      orderBy: { lastMessageAt: 'desc' },
    });
  });

  it('长消息 title 截断 50 字符加省略号', async () => {
    prisma.agentSession.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      agentSlug: 'chat-agent',
      title: null,
    });
    prisma.agentMessage.findMany.mockResolvedValue([]);
    const long = '啊'.repeat(80);
    await service.beginTurn('u1', 's1', 'chat-agent', long);
    const update = prisma.agentSession.update.mock.calls[0][0];
    expect(update.data.title).toBe(`${'啊'.repeat(50)}…`);
  });
});
