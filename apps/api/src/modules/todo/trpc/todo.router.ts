import { z } from 'zod';
import { CreateTodoSchema, UpdateTodoSchema } from '@loom/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { protectedProcedure } from '../../../trpc/trpc';

/**
 * Todo tRPC Router
 *
 * 使用 createCrudRouterWithCustom 组合了标准 CRUD + 自定义方法（toggleComplete）
 *
 * 这是 tRPC Router 的「高级用法」示例，演示了：
 *   1. 如何用 createCrudRouterWithCustom 在标准 CRUD 上添加自定义方法
 *   2. 如何注入当前用户 ID（userId 自动注入）
 *   3. 如何做数据隔离（只能看到自己的 Todo）
 *
 * 如果只需要标准 CRUD，用 createCrudRouter 更简洁：
 *   export const todoRouter = createCrudRouter('Todo', {
 *     create: CreateTodoSchema,
 *     update: UpdateTodoSchema,
 *   });
 *
 * @see trpc.helper.ts 中的 createCrudRouter / createCrudRouterWithCustom
 *
 * Web 端和小程序端请使用 REST Controller（todo.controller.ts）
 */
export const todoRouter = createCrudRouterWithCustom(
  'Todo',
  {
    create: CreateTodoSchema,
    update: UpdateTodoSchema,
  },
  () => ({
    /**
     * 切换 Todo 完成状态
     * 使用 protectedProcedure 确保已登录
     * 示例：自定义 tRPC mutation
     */
    toggleComplete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const todo = await ctx.prisma.todo.findUnique({
          where: { id: input.id },
          select: { isCompleted: true, completedAt: true },
        });

        if (!todo) {
          throw new Error('Todo not found');
        }

        return ctx.prisma.todo.update({
          where: { id: input.id },
          data: {
            isCompleted: !todo.isCompleted,
            status: todo.isCompleted ? 'pending' : 'completed',
            completedAt: todo.isCompleted ? null : new Date(),
          },
        });
      }),

    /**
     * 获取当前用户的所有 Todo（非管理后台使用）
     * 注意：Admin 端通过 dataProvider 调用标准的 getMany
     */
    getMyTodos: protectedProcedure
      .input(
        z.object({
          page: z.number().optional().default(1),
          limit: z.number().optional().default(10),
          status: z.string().optional(),
          isCompleted: z.boolean().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const where: any = { userId: (ctx as any).user?.id };
        if (input.status) where.status = input.status;
        if (input.isCompleted !== undefined) where.isCompleted = input.isCompleted;

        const [items, total] = await Promise.all([
          ctx.prisma.todo.findMany({
            where,
            skip: (input.page - 1) * input.limit,
            take: input.limit,
            orderBy: { createdAt: 'desc' },
          }),
          ctx.prisma.todo.count({ where }),
        ]);

        return {
          items,
          total,
          page: input.page,
          pageSize: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      }),

    /**
     * 获取当前用户的一条 Todo 详情
     */
    getMyTodo: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.todo.findFirst({
          where: { id: input.id, userId: (ctx as any).user?.id },
        });
      }),
  }),
  {
    // 配置：为标准 CRUD 方法启用权限检查
    // protectedGetMany: true,
    searchFields: ['title', 'description'],
    filterableFields: ['status', 'isCompleted', 'priority'],
  },
);
