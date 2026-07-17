import { z } from 'zod';
import { CreateAgentSchema, UpdateAgentSchema } from '@loom/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure, protectedProcedure, publicProcedure } from '../../../trpc/trpc';
import { NotFoundBusinessException, ConflictException, ErrorCodes } from '../../../core/exceptions';

/**
 * Agent 管理 tRPC 路由
 *
 * 提供完整的 CRUD 操作（使用新 Agent 模型字段），
 * 以及 getActive 等自定义方法。
 */
export const agentsRouter = createCrudRouterWithCustom(
  'Agent',
  {
    create: CreateAgentSchema,
    update: UpdateAgentSchema,
  },
  (t) => ({
    getMany: protectedProcedure
      .input(
        z
          .object({
            page: z.number().int().positive().optional(),
            limit: z.number().int().positive().optional(),
            pageSize: z.number().int().positive().optional(),
            search: z.string().optional(),
            where: z.any().optional(),
            orderBy: z.any().optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const page = input?.page ?? 1;
        const pageSize = input?.limit ?? input?.pageSize ?? 10;
        const skip = (page - 1) * pageSize;

        const where: any =
          input?.where && typeof input.where === 'object' ? { ...input.where } : {};

        // Handle search filter
        let searchTerm = input?.search;
        if (!searchTerm && where.search) {
          searchTerm =
            typeof where.search === 'string'
              ? where.search
              : typeof where.search?.contains === 'string'
                ? where.search.contains
                : undefined;
        }
        delete where.search;

        if (searchTerm) {
          where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ];
        }

        const [agents, total] = await Promise.all([
          ctx.prisma.agent.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: input?.orderBy || { sort: 'asc' },
          }),
          ctx.prisma.agent.count({ where }),
        ]);

        return {
          items: agents,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }),

    getOne: permissionProcedure('agent', 'read')
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const agent = await ctx.prisma.agent.findUnique({
          where: { id: input.id },
        });
        if (!agent)
          throw new NotFoundBusinessException('Agent', input.id, ErrorCodes.AGENT_NOT_FOUND);
        return agent;
      }),

    create: permissionProcedure('agent', 'create')
      .input(
        z.object({
          data: CreateAgentSchema,
          include: z.any().optional(),
          select: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data } = input;
        const existing = await ctx.prisma.agent.findUnique({
          where: { slug: data.slug },
        });
        if (existing)
          throw new ConflictException('Agent slug already exists', ErrorCodes.AGENT_SLUG_EXISTS);

        return ctx.prisma.agent.create({
          data: {
            ...data,
            createdById: ctx.user?.id,
            updatedById: ctx.user?.id,
          },
          include: input.include,
          select: input.select,
        });
      }),

    update: permissionProcedure('agent', 'update')
      .input(
        z.object({
          id: z.string(),
          data: UpdateAgentSchema,
          include: z.any().optional(),
          select: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { id, data } = input;
        const existing = await ctx.prisma.agent.findUnique({
          where: { id },
        });
        if (!existing) throw new NotFoundBusinessException('Agent', id, ErrorCodes.AGENT_NOT_FOUND);

        if (data.slug && data.slug !== existing.slug) {
          const slugConflict = await ctx.prisma.agent.findUnique({
            where: { slug: data.slug },
          });
          if (slugConflict)
            throw new ConflictException('Agent slug already exists', ErrorCodes.AGENT_SLUG_EXISTS);
        }

        return ctx.prisma.agent.update({
          where: { id },
          data: {
            ...data,
            updatedById: ctx.user?.id,
          },
          include: input.include,
          select: input.select,
        });
      }),

    delete: permissionProcedure('agent', 'delete')
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.agent.delete({ where: { id: input.id } });
        return { success: true };
      }),

    deleteMany: permissionProcedure('agent', 'delete')
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.agent.deleteMany({
          where: { id: { in: input.ids } },
        });
      }),

    getActive: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.agent.findMany({
        where: { isActive: true },
        orderBy: { sort: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
          model: true,
          systemPrompt: true,
          temperature: true,
          maxTokens: true,
          provider: true,
          sort: true,
        },
      });
    }),
  }),
  {
    includeGetMany: false,
    includeGetOne: false,
    includeCreate: false,
    includeUpdate: false,
    includeDelete: false,
    includeDeleteMany: false,
  },
);
