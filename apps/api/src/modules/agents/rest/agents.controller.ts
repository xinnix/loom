import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { AgentsService } from '../services/agents.service';
import { LlmService } from '../../../llm/llm.service';

@Controller('agents')
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);

  constructor(
    private readonly agentsService: AgentsService,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Agent 聊天流式接口
   *
   * 使用 Agent 配置的模型和参数调用 LLM，以 SSE 格式流式返回。
   * 适用于 Admin 端和 Web 端用户。
   */
  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  async chat(
    @Param('id') id: string,
    @Body() body: { query: string; systemPromptOverride?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const agent = await this.agentsService.getOne(id);
    if (!agent) throw new NotFoundException('Agent not found');
    if (!agent.isActive) throw new NotFoundException('Agent is not active');

    const systemPrompt = body.systemPromptOverride || agent.systemPrompt || '你是一位智能助手。';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const chunk of this.llmService.chatStream({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: body.query },
        ],
        model: agent.model || undefined,
        temperature: agent.temperature ?? undefined,
        maxTokens: agent.maxTokens ?? undefined,
      })) {
        res.write(`data: ${JSON.stringify({ event: 'message', content: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ event: 'done' })}\n\n`);
    } catch (error: any) {
      this.logger.error(`Chat stream error: ${error.message}`);
      res.write(`data: ${JSON.stringify({ event: 'error', message: error.message })}\n\n`);
    }

    res.end();
  }

  /**
   * 用户端 Agent 聊天流式接口
   * 仅供 user 类型账号调用
   */
  @Post(':id/user-chat')
  @UseGuards(JwtAuthGuard)
  async userChat(
    @Param('id') id: string,
    @Body() body: { query: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    if (user.type !== 'user') {
      res.status(403).json({ message: 'Only user accounts can access this endpoint' });
      return;
    }

    const agent = await this.agentsService.getOne(id);
    if (!agent) throw new NotFoundException('Agent not found');
    if (!agent.isActive) throw new NotFoundException('Agent is not active');

    const systemPrompt = agent.systemPrompt || '你是一位智能助手。';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const chunk of this.llmService.chatStream({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: body.query },
        ],
        model: agent.model || undefined,
        temperature: agent.temperature ?? undefined,
        maxTokens: agent.maxTokens ?? undefined,
      })) {
        res.write(`data: ${JSON.stringify({ event: 'message', content: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ event: 'done' })}\n\n`);
    } catch (error: any) {
      this.logger.error(`User chat stream error: ${error.message}`);
      res.write(`data: ${JSON.stringify({ event: 'error', message: error.message })}\n\n`);
    }

    res.end();
  }
}
