import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AgentRunService } from '../../../ai/agents/agent-run.service';

/**
 * Agent 目录（AI 第 3 层的 Admin 管理面）。
 * 行数据由 AgentYamlLoader 按 YML upsert 维护——YML 编排内容只读；
 * 仅部署期绑定字段（llmConfigId 模型绑定）开放受控更新（D3 解析链的中间层）。
 */
@Injectable()
export class AgentsCatalogService extends BaseService<'agent'> {
  constructor(
    prisma: PrismaService,
    private readonly agentRuns: AgentRunService,
  ) {
    super(prisma, 'agent');
  }

  async listRuns(slug: string, page = 1, limit = 10) {
    return this.agentRuns.listBySlug(slug, page, limit);
  }

  /**
   * 绑定 Agent 级默认模型（节点无 llm: 时的回退，D3）。
   * llmConfigId 传 null = 清除绑定，回退全局 isDefault 配置。
   */
  async bindLlm(id: string, llmConfigId: string | null) {
    const agent = await this.prisma.agent.findUnique({ where: { id }, select: { id: true } });
    if (!agent) {
      throw new NotFoundException(`Agent 不存在: ${id}`);
    }

    if (llmConfigId !== null) {
      const config = await this.prisma.llmConfig.findUnique({
        where: { id: llmConfigId },
        select: { isActive: true },
      });
      if (!config) {
        throw new NotFoundException(`模型配置不存在: ${llmConfigId}`);
      }
      if (!config.isActive) {
        throw new BadRequestException('不能绑定已停用的模型配置');
      }
    }

    await this.prisma.agent.update({
      where: { id },
      data: { llmConfigId },
      select: { id: true, slug: true, llmConfigId: true },
    });

    return this.prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        llmConfigId: true,
        llmConfig: { select: { id: true, name: true, configKey: true, model: true } },
      },
    });
  }
}
