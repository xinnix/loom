import { z } from 'zod';
import { Permission } from '@loom/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure } from '../../../trpc/trpc';
import { ErrorCodes } from '../../../core/exceptions';
import { BusinessException } from '../../../core/exceptions/business.exception';
import { AgentsCatalogService } from '../services/agents-catalog.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';

/**
 * AI 第 3 层 Agent 目录（tRPC，Admin 只读）。
 * 编排定义真理源在 YML，Agent 行由 loader upsert 维护——故只开放 read，
 * create/update/delete 权限点已随 D8 收敛删除。
 */
export const createAiAgentsRouter = (service: AgentsCatalogService, loader: AgentYamlLoader) =>
  createCrudRouterWithCustom(
    'agent',
    {},
    () => ({
      runs: permissionProcedure(Permission.agent.read)
        .input(
          z.object({
            slug: z.string().min(1),
            page: z.number().int().positive().optional().default(1),
            limit: z.number().int().positive().max(100).optional().default(10),
          }),
        )
        .query(async ({ input }) => service.listRuns(input.slug, input.page, input.limit)),
      getDefinition: permissionProcedure(Permission.agent.read)
        .input(z.object({ slug: z.string().min(1) }))
        .query(({ input }) => {
          const raw = loader.readRaw(input.slug);
          if (raw === undefined) {
            throw new BusinessException({
              message: `Agent 编排文件不存在: ${input.slug}`,
              errorCode: ErrorCodes.AGENT_NOT_FOUND,
              statusCode: 404,
            });
          }
          return { slug: input.slug, yaml: raw };
        }),
    }),
    {
      includeCreate: false,
      includeUpdate: false,
      includeDelete: false,
      includeDeleteMany: false,
      permissionRead: Permission.agent.read,
      searchFields: ['name', 'slug'],
      filterableFields: ['isActive'],
    },
    service,
  );
