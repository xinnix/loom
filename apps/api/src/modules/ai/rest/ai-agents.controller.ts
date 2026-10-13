import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { Permission } from '@loom/shared';
import {
  AgentRuntimeService,
  type RunEvent,
  type HistoryMessage,
} from '../../../ai/agents/agent-runtime.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';
import { AgentSessionService } from '../services/agent-session.service';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtUser {
  id: string;
  type?: 'admin' | 'user';
  permissions?: string[];
}

/**
 * AI Agent 触发端点（REST，R4：外部端 + Admin Playground 共用）。
 * SSE 事件协议（D6）：run_start / node_start / content / tool_call /
 * tool_result / node_end / run_end / error。
 *
 * ADR-006：user 身份按 YML audience 过滤可见性（D1）；会话模式由
 * sessionId 开启（D4/D5），Admin Playground 维持单次 run。
 */
@Controller('ai/agents')
export class AiAgentsController {
  constructor(
    private readonly runtime: AgentRuntimeService,
    private readonly loader: AgentYamlLoader,
    private readonly sessions: AgentSessionService,
    private readonly prisma: PrismaService,
  ) {}

  /** 激活 agent 列表：admin 全量；user 仅 audience ∈ {user, all}（D1） */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listActive(@Req() req: Request & { user: JwtUser }) {
    const isUser = req.user.type === 'user';
    const agents = await this.prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
      select: { id: true, slug: true, name: true, description: true, icon: true },
    });
    const visible = isUser
      ? agents.filter((a) => (this.loader.get(a.slug)?.audience ?? 'admin') !== 'admin')
      : agents;
    return { success: true, data: visible };
  }

  /**
   * 运行 agent（SSE 流式）。
   * admin 需 agent:run 权限；user 仅认证且 agent audience 须开放（D1）。
   * 请求体 { input?, sessionId? }：sessionId 开启会话模式（D4）——
   * input.message 必填为对话文本，历史注入首个节点（D5），run 产出
   * 写回会话。Admin 带 sessionId → 403（会话仅用户端，D3）。
   * 客户端断连 → AbortSignal 中止 LLM 请求，run 标记 failed。
   */
  @Post(':slug/run')
  @UseGuards(JwtAuthGuard)
  async run(
    @Param('slug') slug: string,
    @Body() body: { input?: Record<string, unknown>; sessionId?: string },
    @Req() req: Request & { user: JwtUser },
    @Res() res: Response,
  ) {
    const user = req.user;
    const isUser = user.type === 'user';
    if (!isUser && !(user.permissions ?? []).includes(Permission.agent.run)) {
      throw new ForbiddenException(`需要权限 ${Permission.agent.run}`);
    }

    const def = this.loader.get(slug);
    if (!def) throw new NotFoundException(`Agent 不存在: ${slug}`);
    if (isUser && (def.audience ?? 'admin') === 'admin') {
      throw new ForbiddenException(`Agent ${slug} 未开放给用户端`);
    }

    const input = body.input ?? {};

    // 会话模式（D4）：归属校验 + 写用户消息 + 取历史
    let history: HistoryMessage[] | undefined;
    const sessionId = body.sessionId;
    if (sessionId) {
      this.sessions.assertUserType(user.type);
      const message = input.message;
      if (typeof message !== 'string' || !message.trim()) {
        throw new BadRequestException('会话模式请求体必须包含非空 input.message 字符串');
      }
      history = (await this.sessions.beginTurn(user.id, sessionId, slug, message)).history;
    }

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const write = (event: RunEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const result = await this.runtime.run(
        slug,
        input,
        {
          authorization: req.headers.authorization,
          permissions: user.permissions ?? [],
          userId: user.id,
          userType: isUser ? 'user' : 'admin',
          signal: abortController.signal,
          triggeredById: user.id,
          triggeredByType: isUser ? 'user' : 'admin',
          history,
        },
        write,
      );
      if (sessionId) await this.sessions.endTurn(sessionId, result.runId, result.output);
    } catch (err) {
      // runtime 已落库 failed 并 emit error 事件；此处仅兜底连接层错误。
      // 会话模式下用户消息已落库（beginTurn），assistant 消息不写——失败轮次留痕。
      if (!res.writableEnded) {
        write({ type: 'error', message: (err as Error).message });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }
}

/**
 * 用户端 Agent 会话端点（ADR-006 D4，仅 user 身份，强制 userId 隔离）。
 * 独立 Controller 避免与 :slug 路由段冲突。
 */
@Controller('ai/sessions')
@UseGuards(JwtAuthGuard)
export class AiSessionsController {
  constructor(private readonly sessions: AgentSessionService) {}

  /** 建会话 { agentSlug }（agent 须 audience 开放且未停用） */
  @Post()
  async create(@Body() body: { agentSlug?: string }, @Req() req: Request & { user: JwtUser }) {
    this.sessions.assertUserType(req.user.type);
    if (!body.agentSlug) throw new BadRequestException('agentSlug 必填');
    const session = await this.sessions.create(req.user.id, body.agentSlug);
    return { success: true, data: session };
  }

  /** 当前用户会话列表（?agentSlug= 可选过滤，lastMessageAt 倒序） */
  @Get()
  async list(
    @Query('agentSlug') agentSlug: string | undefined,
    @Req() req: Request & { user: JwtUser },
  ) {
    this.sessions.assertUserType(req.user.type);
    const data = await this.sessions.list(req.user.id, agentSlug || undefined);
    return { success: true, data };
  }

  /** 会话 + 消息（恢复上下文） */
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: Request & { user: JwtUser }) {
    this.sessions.assertUserType(req.user.type);
    const data = await this.sessions.getWithMessages(req.user.id, id);
    return { success: true, data };
  }

  /** 删会话（消息级联） */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request & { user: JwtUser }) {
    this.sessions.assertUserType(req.user.type);
    await this.sessions.remove(req.user.id, id);
    return { success: true };
  }
}
