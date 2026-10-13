import { z } from 'zod';
import { Permission } from '@loom/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure } from '../../../trpc/trpc';
import { ErrorCodes } from '../../../core/exceptions';
import { BusinessException } from '../../../core/exceptions/business.exception';
import { AgentsCatalogService } from '../services/agents-catalog.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';

/**
 * AI 第 3 层 Agent 目录（tRPC，Admin 管理）。
 * 编排定义真理源在 YML，Agent 行由 loader upsert 维护——YML 内容只读；
 * 仅部署期绑定（llmConfigId）开放受控更新，走 agent:update 权限。
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
      bindLlm: permissionProcedure(Permission.agent.update)
        .input(
          z.object({
            id: z.string().min(1),
            llmConfigId: z.string().min(1).nullable(),
          }),
        )
        .mutation(async ({ input }) => service.bindLlm(input.id, input.llmConfigId)),
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
