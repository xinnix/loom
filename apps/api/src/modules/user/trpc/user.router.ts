import { Permission } from '@loom/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure, publicProcedure } from '../../../trpc/trpc';
import { z } from 'zod';
import { NotFoundBusinessException, ErrorCodes } from '../../../core/exceptions';

/**
 * 安全的用户字段选择（排除 passwordHash/sessionKey 等敏感信息）
 */
const USER_SAFE_SELECT = {
  id: true,
  username: true,
  email: true,
  nickname: true,
  phone: true,
  avatar: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  openid: true,
  unionid: true,
} as const;

/**
 * User tRPC Router
 *
 * Manages User (miniapp users) - read-only for admin dashboard.
 * Users are created automatically via WeChat login.
 */
export const userRouter = createCrudRouterWithCustom(
  'User',
  {},
  () => ({
    /**
     * 获取用户列表（带搜索和筛选）
     * 自定义实现以保证安全字段选择
     */
    getMany: publicProcedure
      .input(
        z.object({
          page: z.number().optional().default(1),
          limit: z.number().optional().default(10),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { page = 1, limit = 10, where = {}, orderBy } = input;
        const skip = (page - 1) * limit;

        const { search, isActive, ...restWhere } = where;
        const prismaWhere: any = { ...restWhere };

        const searchStr = typeof search === 'string' ? search : String(search || '');
        if (searchStr) {
          prismaWhere.OR = [
            { username: { contains: searchStr, mode: 'insensitive' } },
            { email: { contains: searchStr, mode: 'insensitive' } },
            { nickname: { contains: searchStr, mode: 'insensitive' } },
            { phone: { contains: searchStr, mode: 'insensitive' } },
          ];
        }

        if (isActive !== undefined) {
          prismaWhere.isActive = isActive;
        }

        const [users, total] = await Promise.all([
          ctx.prisma.user.findMany({
            where: prismaWhere,
            skip,
            take: limit,
            orderBy: orderBy || { createdAt: 'desc' },
            select: USER_SAFE_SELECT,
          }),
          ctx.prisma.user.count({ where: prismaWhere }),
        ]);

        return {
          items: users,
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        };
      }),

    /**
     * 获取用户详情（含 _count）
     */
    getOne: permissionProcedure(Permission.user.read)
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.id },
          select: {
            ...USER_SAFE_SELECT,
            _count: {
              select: {
                orders: true,
                todos: true,
              },
            },
          },
        });

        if (!user) {
          throw new NotFoundBusinessException('User', input.id, ErrorCodes.USER_NOT_FOUND);
        }

        return user;
      }),

    /**
     * 更新用户信息（限 nickname/phone/avatar/isActive）
     * 注意：User Prisma 模型使用 nickname 而非 firstName+lastName
     */
    update: permissionProcedure(Permission.user.update)
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            nickname: z.string().optional(),
            phone: z.string().optional(),
            avatar: z.string().optional(),
            isActive: z.boolean().optional(),
          }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { id, data } = input;

        const user = await ctx.prisma.user.update({
          where: { id },
          data,
          select: {
            id: true,
            username: true,
            email: true,
            nickname: true,
            phone: true,
            avatar: true,
            isActive: true,
            updatedAt: true,
          },
        });

        return user;
      }),

    /**
     * 切换用户激活状态
     */
    toggleActive: permissionProcedure(Permission.user.update)
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.id },
          select: { isActive: true },
        });

        if (!user) {
          throw new NotFoundBusinessException('User', input.id, ErrorCodes.USER_NOT_FOUND);
        }

        return ctx.prisma.user.update({
          where: { id: input.id },
          data: { isActive: !user.isActive },
          select: { id: true, isActive: true },
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
