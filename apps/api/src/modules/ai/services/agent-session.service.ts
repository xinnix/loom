import { Injectable } from '@nestjs/common';
import { ErrorCodes } from '../../../core/exceptions';
import { BusinessException } from '../../../core/exceptions/business.exception';
import { PrismaService } from '../../../prisma/prisma.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';

const HISTORY_LIMIT = 20; // 会话模式历史注入上限（最近 N 条，ADR-006 D5，MVP 硬编码）
const TITLE_MAX = 50; // title 截断长度（MVP：截断首条用户消息，不做 AI 摘要）

/**
 * 用户端 Agent 会话（ADR-006 D3/D4）。
 *
 * 作用域仅用户端：所有方法以 user 身份的 userId 为准（admin 调用由
 * controller 层 403 拒绝），查询强制 userId 隔离（数据隔离红线）。
 * 会话绑定单一 agentSlug。
 */
@Injectable()
export class AgentSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loader: AgentYamlLoader,
  ) {}

  /** 会话端点仅用户端可用（ADR-006 D3：防止 Admin 也有会话的语义漂移） */
  assertUserType(userType?: 'admin' | 'user'): void {
    if (userType !== 'user') {
      throw new BusinessException({
        message: '会话功能仅面向用户端',
        errorCode: ErrorCodes.AI_SESSION_FORBIDDEN,
        statusCode: 403,
      });
    }
  }

  /** audience 校验：user 只能对开放给用户端的 agent 建会话 */
  private assertAgentUsable(agentSlug: string): void {
    const def = this.loader.get(agentSlug);
    if (!def) {
      throw new BusinessException({
        message: `Agent 不存在: ${agentSlug}`,
        errorCode: ErrorCodes.AGENT_NOT_FOUND,
        statusCode: 404,
      });
    }
    if (def.audience === 'admin') {
      throw new BusinessException({
        message: `Agent ${agentSlug} 未开放给用户端`,
        errorCode: ErrorCodes.AI_SESSION_FORBIDDEN,
        statusCode: 403,
      });
    }
  }

  async create(userId: string, agentSlug: string) {
    this.assertAgentUsable(agentSlug);
    const agent = await this.prisma.agent.findUnique({ where: { slug: agentSlug } });
    if (agent && !agent.isActive) {
      throw new BusinessException({
        message: `Agent ${agentSlug} 已停用`,
        errorCode: ErrorCodes.AI_AGENT_DISABLED,
        statusCode: 409,
      });
    }
    return this.prisma.agentSession.create({
      data: { userId, agentSlug },
    });
  }

  list(userId: string, agentSlug?: string) {
    return this.prisma.agentSession.findMany({
      where: { userId, ...(agentSlug ? { agentSlug } : {}) },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  /** 会话 + 消息列表（归属校验内建） */
  async getWithMessages(userId: string, sessionId: string) {
    const session = await this.getOwned(userId, sessionId);
    const messages = await this.prisma.agentMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });
    return { ...session, messages };
  }

  async remove(userId: string, sessionId: string): Promise<void> {
    const session = await this.getOwned(userId, sessionId);
    await this.prisma.agentSession.delete({ where: { id: session.id } });
  }

  /** 归属校验：不存在与非本人一致返回 404（不泄露存在性） */
  private async getOwned(userId: string, sessionId: string) {
    const session = await this.prisma.agentSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new BusinessException({
        message: '会话不存在',
        errorCode: ErrorCodes.AI_SESSION_NOT_FOUND,
        statusCode: 404,
      });
    }
    return session;
  }

  // ── run 端点会话模式支撑（ADR-006 D4/D5） ──────────────────

  /**
   * run + sessionId：校验归属与 agent 一致性，写入用户消息并推进排序键
   * （title 为空时从本条消息生成），返回最近 HISTORY_LIMIT 条历史（正序）。
   * 非本人/不存在 → 404；会话的 agentSlug 与路由不一致 → 400。
   */
  async beginTurn(
    userId: string,
    sessionId: string,
    agentSlug: string,
    userText: string,
  ): Promise<{ sessionId: string; history: { role: 'user' | 'assistant'; content: string }[] }> {
    const session = await this.getOwned(userId, sessionId);
    if (session.agentSlug !== agentSlug) {
      throw new BusinessException({
        message: `会话属于 agent ${session.agentSlug}，与请求的 ${agentSlug} 不一致`,
        errorCode: ErrorCodes.AI_SESSION_FORBIDDEN,
        statusCode: 400,
      });
    }
    await this.prisma.$transaction([
      this.prisma.agentMessage.create({
        data: { sessionId: session.id, role: 'user', content: userText },
      }),
      this.prisma.agentSession.update({
        where: { id: session.id },
        data: {
          lastMessageAt: new Date(),
          ...(session.title ? {} : { title: toTitle(userText) }),
        },
      }),
    ]);
    const recent = await this.prisma.agentMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      // 跳过刚写入的当前消息，取最近 N 条历史
      skip: 1,
      take: HISTORY_LIMIT,
    });
    return {
      sessionId: session.id,
      history: recent
        .reverse()
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    };
  }

  /** run 结束写 assistant 消息（关联 AgentRun 审计）并推进排序键 */
  async endTurn(sessionId: string, runId: string, output: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.agentMessage.create({
        data: { sessionId, role: 'assistant', content: output, runId },
      }),
      this.prisma.agentSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
  }
}

function toTitle(userText: string): string {
  const singleLine = userText.trim().replace(/\s+/g, ' ');
  if (!singleLine) return '新会话';
  return singleLine.length > TITLE_MAX ? `${singleLine.slice(0, TITLE_MAX)}…` : singleLine;
}
