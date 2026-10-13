import { z } from 'zod';
import { Permission } from '@loom/shared';
import { router } from '../../../trpc/trpc';
import { permissionProcedure } from '../../../trpc/trpc';
import { ToolRegistry } from '../../../ai/tools/tool.registry';
import { ToolExecutor } from '../../../ai/tools/tool.executor';
import type { ToolExecutionContext } from '../../../ai/tools/interfaces';

/**
 * AI 工具目录（tRPC，Admin 只读 + 试运行）。
 *
 * 数据源是 ToolRegistry 内存对象而非 Prisma——这是 createCrudRouter 工厂的
 * 合理例外（工具真理源在 YML，不走数据库），非欠债。
 */
export const createAiToolsRouter = (registry: ToolRegistry) => {
  const executor = new ToolExecutor();
  return router({
    list: permissionProcedure(Permission.aiTool.read).query(() => registry.list()),
    test: permissionProcedure(Permission.aiTool.read)
      .input(
        z.object({ name: z.string().min(1), args: z.record(z.string(), z.unknown()).default({}) }),
      )
      .mutation(async ({ ctx, input }) => {
        const tool = registry.getOrThrow(input.name);
        const adminCtx = ctx.user as
          { id?: string; type?: string; permissions?: string[] } | undefined;
        const runCtx: ToolExecutionContext = {
          authorization: undefined, // tRPC 内部调用无外部 JWT；内部 REST 走不到
          permissions: adminCtx?.permissions ?? [],
          userId: adminCtx?.id,
          userType: 'admin',
        };
        const result = await executor.execute(tool, input.args, runCtx);
        return result;
      }),
  });
};
