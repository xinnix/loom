import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { Permission } from '@loom/shared';
import { AgentRuntimeService, type RunEvent } from '../../../ai/agents/agent-runtime.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';
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
 */
@Controller('ai/agents')
export class AiAgentsController {
  constructor(
    private readonly runtime: AgentRuntimeService,
    private readonly loader: AgentYamlLoader,
    private readonly prisma: PrismaService,
  ) {}

  /** 激活 agent 列表（供外部端发现） */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listActive() {
    const agents = await this.prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
      select: { id: true, slug: true, name: true, description: true, icon: true },
    });
    return { success: true, data: agents };
  }

  /**
   * 运行 agent（SSE 流式）。
   * admin 需 agent:run 权限；user 类型仅认证（与旧 /user-chat 语义一致）。
   * 客户端断连 → AbortSignal 中止 LLM 请求，run 标记 failed。
   */
  @Post(':slug/run')
  @UseGuards(JwtAuthGuard)
  async run(
    @Param('slug') slug: string,
    @Body() body: { input?: Record<string, unknown> },
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

    const input = body.input ?? {};
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
      await this.runtime.run(
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
        },
        write,
      );
    } catch (err) {
      // runtime 已落库 failed 并 emit error 事件；此处仅兜底连接层错误
      if (!res.writableEnded) {
        write({ type: 'error', message: (err as Error).message });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }
}
