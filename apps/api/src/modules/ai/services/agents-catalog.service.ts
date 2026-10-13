import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AgentRunService } from '../../../ai/agents/agent-run.service';

/**
 * Agent 目录（AI 第 3 层的 Admin 只读管理面）。
 * 行数据由 AgentYamlLoader 按 YML upsert 维护，本 service 仅提供只读查询
 * 与 run 历史委托。
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
}
