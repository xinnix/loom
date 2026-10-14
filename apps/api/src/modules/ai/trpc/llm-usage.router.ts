import { z } from 'zod';
import { Permission } from '@loom/shared';
import { router, permissionProcedure, getSettingsService } from '../../../trpc/trpc';
import { PrismaService } from '../../../prisma/prisma.service';
import { computeLlmUsageOverview } from '../../../ai/llm-trace/llm-usage-agg';

const overviewInput = z.object({
  days: z.union([z.literal(7), z.literal(14), z.literal(30)]).default(7),
});

const logsInput = z
  .object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    sceneKey: z.string().optional(),
    status: z.string().optional(),
    model: z.string().optional(),
    day: z.string().optional(),
    traceId: z.string().optional(),
  })
  .optional();

/**
 * AI 用量看板（ADR-007）：只读聚合 + 明细查询。
 * 记账本只含 token/耗时/错误摘要，无 prompt/出参内容；权限独立 resource=llmusage。
 */
export const createLlmUsageRouter = (prisma: PrismaService) => {
  // 价格兜底键：SettingsService（ADR-008，DB → env 链），SettingsService.get 兼容 LlmUsageSettingsLike
  return router({
    getOverview: permissionProcedure(Permission.llmusage.read)
      .input(overviewInput)
      .query(({ input }) => computeLlmUsageOverview(prisma, getSettingsService(), input.days)),

    getLogs: permissionProcedure(Permission.llmusage.read)
      .input(logsInput)
      .query(async ({ ctx, input }) => {
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const skip = (page - 1) * pageSize;

        const where: Record<string, unknown> = {};
        if (input?.sceneKey) where.sceneKey = input.sceneKey;
        if (input?.status) where.status = input.status;
        if (input?.model) where.model = { contains: input.model };
        if (input?.day) where.day = input.day;
        if (input?.traceId) where.traceId = input.traceId;

        const [items, total] = await Promise.all([
          ctx.prisma.llmCallLog.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
          }),
          ctx.prisma.llmCallLog.count({ where }),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
  });
};
