import { Permission } from '@loom/shared';
import { router, publicProcedure, permissionProcedure } from '../../../trpc/trpc';
import { z } from 'zod';
import { NotFoundBusinessException, ErrorCodes } from '../../../core/exceptions';

/**
 * User tRPC Router
 *
 * Manages User (miniapp users) - read-only for admin dashboard
 * Users are created automatically via WeChat login
 */
export const userRouter = router({
  // Get list of miniapp users
  getMany: publicProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10),
        skip: z.number().optional(),
        take: z.number().optional(),
        where: z.any().optional(),
        orderBy: z.any().optional(),
        include: z.any().optional(),
        select: z.any().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 10, where = {}, orderBy } = input;
      const skip = (page - 1) * limit;

      // Extract custom filters from where object
      const { search, isActive, ...restWhere } = where;

      // Build Prisma where clause
      const prismaWhere: any = { ...restWhere };

      // 确保 search 是字符串类型
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
          select: {
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
          },
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

  // Get single user detail
  getOne: permissionProcedure(Permission.user.read)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
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

  // Update user (limited fields)
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

  // Toggle user active status
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

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { isActive: !user.isActive },
        select: {
          id: true,
          isActive: true,
        },
      });

      return updatedUser;
    }),
});
