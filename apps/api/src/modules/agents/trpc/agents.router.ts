import { z } from 'zod';
import { CreateAgentSchema, UpdateAgentSchema } from '@loom/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure, protectedProcedure, publicProcedure } from '../../../trpc/trpc';
import { DifyService } from '../services/dify.service';
import { NotFoundBusinessException, ConflictException, ErrorCodes } from '../../../core/exceptions';

const difyService = new DifyService();

const maskApiKey = (key: string): string => {
  if (!key || key.length <= 4) return '****';
  return `****${key.slice(-4)}`;
};

const maskAgentRecord = (record: any): any => {
  if (!record) return record;
  return { ...record, difyApiKey: maskApiKey(record.difyApiKey) };
};

const maskAgentRecords = (records: any[]): any[] => {
  return records.map(maskAgentRecord);
};

const agentGetManySchema = z
  .object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    search: z.string().optional(),
    where: z.any().optional(),
    orderBy: z.any().optional(),
  })
  .optional();

export const agentsRouter = createCrudRouterWithCustom(
  'Agent',
  {
    create: CreateAgentSchema,
    update: UpdateAgentSchema,
  },
  () => ({
    getMany: publicProcedure.input(agentGetManySchema).query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.limit ?? input?.pageSize ?? 10;
      const skip = (page - 1) * pageSize;

      const where: any = input?.where && typeof input.where === 'object' ? { ...input.where } : {};

      let searchTerm = input?.search;
      const whereSearch = where.search;
      if (!searchTerm && whereSearch) {
        if (typeof whereSearch === 'string') {
          searchTerm = whereSearch;
        } else if (typeof whereSearch?.contains === 'string') {
          searchTerm = whereSearch.contains;
        }
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
        items: maskAgentRecords(agents),
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
        return maskAgentRecord(agent);
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

    getConversations: protectedProcedure
      .input(
        z.object({
          agentId: z.string(),
          limit: z.number().int().positive().optional(),
          lastId: z.string().optional(),
          sortBy: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const agent = await ctx.prisma.agent.findUnique({
          where: { id: input.agentId },
        });
        if (!agent)
          throw new NotFoundBusinessException('Agent', input.agentId, ErrorCodes.AGENT_NOT_FOUND);

        const userType = (ctx.user as any)?.type || 'admin';
        const difyUser = userType === 'user' ? `user_${ctx.user.id}` : `admin_${ctx.user.id}`;

        return difyService.getConversations({
          apiUrl: agent.difyApiUrl,
          apiKey: agent.difyApiKey,
          user: difyUser,
          limit: input.limit,
          lastId: input.lastId,
          sortBy: input.sortBy,
        });
      }),

    getMessages: protectedProcedure
      .input(
        z.object({
          agentId: z.string(),
          conversationId: z.string(),
          limit: z.number().int().positive().optional(),
          firstId: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const agent = await ctx.prisma.agent.findUnique({
          where: { id: input.agentId },
        });
        if (!agent)
          throw new NotFoundBusinessException('Agent', input.agentId, ErrorCodes.AGENT_NOT_FOUND);

        const userType = (ctx.user as any)?.type || 'admin';
        const difyUser = userType === 'user' ? `user_${ctx.user.id}` : `admin_${ctx.user.id}`;

        return difyService.getMessages(
          agent.difyApiUrl,
          agent.difyApiKey,
          input.conversationId,
          difyUser,
          input.limit,
          input.firstId,
        );
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
          difyAppType: true,
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
