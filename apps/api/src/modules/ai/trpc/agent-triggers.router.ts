import { CreateAgentTriggerSchema, Permission, UpdateAgentTriggerSchema } from '@loom/shared';
import { z } from 'zod';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure } from '../../../trpc/trpc';
import { ErrorCodes } from '../../../core/exceptions';
import { BusinessException } from '../../../core/exceptions/business.exception';
import { AgentTriggerService } from '../../../ai/agent-trigger/agent-trigger.service';
import { AgentTriggerDispatcherService } from '../../../ai/agent-trigger/agent-trigger-dispatcher.service';
import { AgentYamlLoader } from '../../../ai/agents/agent-yaml.loader';

/**
 * Agent 定时触发管理（ADR-009，tRPC Admin 面）。
 * runOnce 手动执行不推进调度水位；agentSlug 须为已加载的 YML agent。
 */
export const createAgentTriggersRouter = (
  service: AgentTriggerService,
  dispatcher: AgentTriggerDispatcherService,
  loader: AgentYamlLoader,
) =>
  createCrudRouterWithCustom(
    'agentTrigger',
    {
      create: CreateAgentTriggerSchema,
      update: UpdateAgentTriggerSchema,
    },
    () => ({
      runOnce: permissionProcedure(Permission.agentTrigger.run)
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
          const result = await dispatcher.runOnce(input.id);
          if (!result) {
            throw new BusinessException({
              message: `触发器不存在或未启用: ${input.id}`,
              errorCode: ErrorCodes.AGENT_NOT_FOUND,
              statusCode: 404,
            });
          }
          return result;
        }),
      slugs: permissionProcedure(Permission.agentTrigger.read).query(() =>
        loader.list().map((d) => d.name),
      ),
    }),
    {
      permissionRead: Permission.agentTrigger.read,
      permissionCreate: Permission.agentTrigger.create,
      permissionUpdate: Permission.agentTrigger.update,
      permissionDelete: Permission.agentTrigger.delete,
      searchFields: ['name', 'agentSlug'],
      filterableFields: ['enabled', 'source'],
    },
    service,
  );
