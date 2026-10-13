import { z } from 'zod';
import { CreateLlmConfigSchema, Permission, UpdateLlmConfigSchema } from '@loom/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure } from '../../../trpc/trpc';
import { ErrorCodes } from '../../../core/exceptions';
import { BusinessException } from '../../../core/exceptions/business.exception';
import { LlmConfigsService } from '../services/llm-configs.service';
import { LlmCryptoService } from '../../../ai/llm/llm-crypto.service';
import { buildPiModel } from '../../../ai/llm/pi-model.factory';

/**
 * AI 第 1 层 Admin 管理（tRPC，R4：Admin 端）。
 * 标准走 createCrudRouter 工厂 + service 钩子（加密）；apiKeyEnc 永不回传（F6）。
 */
export const createLlmConfigsRouter = (service: LlmConfigsService) =>
  createCrudRouterWithCustom(
    'llmConfig',
    {
      create: CreateLlmConfigSchema,
      update: UpdateLlmConfigSchema,
    },
    () => ({
      testConnection: permissionProcedure(Permission.llmConfig.read)
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const row = await ctx.prisma.llmConfig.findUnique({ where: { id: input.id } });
          if (!row || !row.isActive) {
            throw new BusinessException({
              message: `模型配置不存在或未启用: ${input.id}`,
              errorCode: ErrorCodes.AI_CONFIG_NOT_FOUND,
              statusCode: 404,
            });
          }
          const resolved = {
            configKey: row.configKey,
            name: row.name,
            provider: row.provider,
            apiUrl: row.apiUrl,
            apiKey: LlmCryptoService.fromEnv().decrypt(row.apiKeyEnc),
            model: row.model,
            temperature: row.temperature ?? undefined,
            maxTokens: row.maxTokens ?? undefined,
            timeoutMs: row.timeoutMs,
            maxRetries: row.maxRetries,
          };
          const started = Date.now();
          try {
            const { models, model } = await buildPiModel(resolved);
            await models.complete(
              model,
              {
                systemPrompt: 'You are a connection test.',
                messages: [{ role: 'user', content: 'ping', timestamp: Date.now() }],
              },
              { maxTokens: 8 },
            );
            return { ok: true, latencyMs: Date.now() - started, model: resolved.model };
          } catch (err) {
            // 错误摘要截断，不含原始响应体（OWASP 5.10）
            return {
              ok: false,
              latencyMs: Date.now() - started,
              error: (err as Error).message.slice(0, 300),
            };
          }
        }),
    }),
    {
      permissionRead: Permission.llmConfig.read,
      permissionCreate: Permission.llmConfig.create,
      permissionUpdate: Permission.llmConfig.update,
      permissionDelete: Permission.llmConfig.delete,
      searchFields: ['name', 'configKey'],
      filterableFields: ['isActive', 'provider'],
    },
    service,
  );
