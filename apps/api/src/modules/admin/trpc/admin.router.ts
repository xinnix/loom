import { Permission } from '@loom/shared';
import { router, permissionProcedure, publicProcedure } from '../../../trpc/trpc';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import {
  NotFoundBusinessException,
  ConflictException,
  ForbiddenBusinessException,
  ErrorCodes,
} from '../../../core/exceptions';

/**
 * Admin tRPC Router
 *
 * Manages Admin users (backend management users).
 * CRUD 操作为自定义实现，包含密码哈希、角色管理、自我删除保护等业务逻辑。
 * AdminService 文档化了生命周期约束（beforeCreate/beforeDelete 等），
 * 但当前通过手动调用 ctx.prisma 执行数据库操作。
 */
export const adminRouter = router({
  // ==========================================
  // 标准 CRUD
  // ==========================================

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

      const { search, isActive, roleSlug, ...restWhere } = where;
      const prismaWhere: any = { ...restWhere };

      if (search) {
        prismaWhere.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isActive !== undefined) {
        prismaWhere.isActive = isActive;
      }

      if (roleSlug) {
        prismaWhere.roles = {
          some: {
            role: { slug: roleSlug },
          },
        };
      }

      const [admins, total] = await Promise.all([
        ctx.prisma.admin.findMany({
          where: prismaWhere,
          skip,
          take: limit,
          orderBy: orderBy || { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            roles: {
              select: {
                role: {
                  select: { id: true, name: true, slug: true, level: true },
                },
              },
            },
          },
        }),
        ctx.prisma.admin.count({ where: prismaWhere }),
      ]);

      return {
        items: admins.map((admin) => ({
          ...admin,
          roles: admin.roles.map((r: any) => r.role),
        })),
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getOne: permissionProcedure(Permission.admin.read)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const admin = await ctx.prisma.admin.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  level: true,
                  description: true,
                  isSystem: true,
                },
              },
              assignedAt: true,
            },
            orderBy: { role: { level: 'asc' } },
          },
        },
      });

      if (!admin) {
        throw new NotFoundBusinessException('Admin', input.id, ErrorCodes.ADMIN_NOT_FOUND);
      }

      return {
        ...admin,
        roles: admin.roles.map((r: any) => ({ ...r.role, assignedAt: r.assignedAt })),
      };
    }),

  create: permissionProcedure(Permission.admin.create)
    .input(
      z.object({
        data: z.object({
          username: z.string().min(3),
          email: z.string().email(),
          password: z.string().min(8),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          avatar: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data } = input;

      // Check uniqueness
      const existing = await ctx.prisma.admin.findFirst({
        where: { OR: [{ username: data.username }, { email: data.email }] },
      });
      if (existing) {
        throw new ConflictException(
          'Username or email already exists',
          ErrorCodes.ADMIN_ALREADY_EXISTS,
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Assign default viewer role
      const viewerRole = await ctx.prisma.role.findUnique({ where: { slug: 'viewer' } });

      return ctx.prisma.admin.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          avatar: data.avatar,
          isActive: data.isActive ?? true,
          roles: viewerRole ? { create: { roleId: viewerRole.id, assignedBy: null } } : undefined,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
      });
    }),

  update: permissionProcedure(Permission.admin.update)
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          username: z.string().min(3).optional(),
          email: z.string().email().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          avatar: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      const existing = await ctx.prisma.admin.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundBusinessException('Admin', id, ErrorCodes.ADMIN_NOT_FOUND);
      }

      // Check uniqueness of username/email
      if (data.username || data.email) {
        const orConditions: any[] = [];
        if (data.username) orConditions.push({ username: data.username });
        if (data.email) orConditions.push({ email: data.email });

        const duplicate = await ctx.prisma.admin.findFirst({
          where: { AND: [{ id: { not: id } }, { OR: orConditions }] },
        });
        if (duplicate) {
          throw new ConflictException(
            'Username or email already exists',
            ErrorCodes.ADMIN_ALREADY_EXISTS,
          );
        }
      }

      return ctx.prisma.admin.update({
        where: { id },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          updatedAt: true,
        },
      });
    }),

  delete: permissionProcedure(Permission.admin.delete)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deletion
      if (input.id === (ctx as any).user?.id) {
        throw new ForbiddenBusinessException(
          'Cannot delete yourself',
          ErrorCodes.ADMIN_CANNOT_DELETE_SELF,
        );
      }

      // Check if admin exists
      const admin = await ctx.prisma.admin.findUnique({
        where: { id: input.id },
        include: { roles: { include: { role: true } } },
      });
      if (!admin) {
        throw new NotFoundBusinessException('Admin', input.id, ErrorCodes.ADMIN_NOT_FOUND);
      }

      // Protect last super admin
      const hasSuperAdmin = admin.roles.some((ar: any) => ar.role.slug === 'super_admin');
      if (hasSuperAdmin) {
        const superAdminCount = await ctx.prisma.admin.count({
          where: { roles: { some: { role: { slug: 'super_admin' } } } },
        });
        if (superAdminCount <= 1) {
          throw new ForbiddenBusinessException(
            'Cannot delete the last super admin',
            ErrorCodes.ADMIN_LAST_SUPER_ADMIN,
          );
        }
      }

      // Cascade delete
      await ctx.prisma.$transaction(async (tx: any) => {
        await tx.adminRole.deleteMany({ where: { adminId: input.id } });
        await tx.adminRefreshToken.deleteMany({ where: { adminId: input.id } });
        await tx.admin.delete({ where: { id: input.id } });
      });

      return { success: true };
    }),

  deleteMany: permissionProcedure(Permission.admin.delete)
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const filteredIds = input.ids.filter((id) => id !== (ctx as any).user?.id);

      if (filteredIds.length === 0) {
        throw new ForbiddenBusinessException(
          'Cannot delete yourself',
          ErrorCodes.ADMIN_CANNOT_DELETE_SELF,
        );
      }

      // Check last super admin
      const superAdminAdmins = await ctx.prisma.admin.findMany({
        where: {
          id: { in: filteredIds },
          roles: { some: { role: { slug: 'super_admin' } } },
        },
      });

      if (superAdminAdmins.length > 0) {
        const totalSuperAdmins = await ctx.prisma.admin.count({
          where: { roles: { some: { role: { slug: 'super_admin' } } } },
        });
        if (totalSuperAdmins <= superAdminAdmins.length) {
          throw new ForbiddenBusinessException(
            'Cannot delete all super admins',
            ErrorCodes.ADMIN_LAST_SUPER_ADMIN,
          );
        }
      }

      // Cascade delete for each admin
      let deletedCount = 0;
      for (const adminId of filteredIds) {
        await ctx.prisma.$transaction(async (tx: any) => {
          await tx.adminRole.deleteMany({ where: { adminId } });
          await tx.adminRefreshToken.deleteMany({ where: { adminId } });
          await tx.admin.delete({ where: { id: adminId } });
        });
        deletedCount++;
      }

      return { success: true, count: deletedCount };
    }),

  // ==========================================
  // 自定义方法
  // ==========================================

  toggleActive: permissionProcedure(Permission.admin.update)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === (ctx as any).user?.id) {
        throw new ForbiddenBusinessException(
          'Cannot deactivate yourself',
          ErrorCodes.ADMIN_CANNOT_DEACTIVATE_SELF,
        );
      }

      const admin = await ctx.prisma.admin.findUnique({
        where: { id: input.id },
        select: { isActive: true },
      });
      if (!admin) {
        throw new NotFoundBusinessException('Admin', input.id, ErrorCodes.ADMIN_NOT_FOUND);
      }

      return ctx.prisma.admin.update({
        where: { id: input.id },
        data: { isActive: !admin.isActive },
        select: { id: true, isActive: true },
      });
    }),

  getRoles: permissionProcedure(Permission.admin.read)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const adminRoles = await ctx.prisma.adminRole.findMany({
        where: { adminId: input.id },
        include: { role: true },
        orderBy: { role: { level: 'asc' } },
      });

      return adminRoles.map((ar: any) => ({
        id: ar.role.id,
        name: ar.role.name,
        slug: ar.role.slug,
        level: ar.role.level,
        description: ar.role.description,
        isSystem: ar.role.isSystem,
        assignedAt: ar.assignedAt,
      }));
    }),

  assignRole: permissionProcedure(Permission.admin.manage_roles)
    .input(z.object({ adminId: z.string(), roleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({ where: { id: input.roleId } });
      if (!role) {
        throw new NotFoundBusinessException('Role', input.roleId, ErrorCodes.ROLE_NOT_FOUND);
      }

      const existing = await ctx.prisma.adminRole.findUnique({
        where: { adminId_roleId: { adminId: input.adminId, roleId: input.roleId } },
      });

      if (existing) {
        return { success: true, message: '管理员已拥有该角色' };
      }

      await ctx.prisma.adminRole.create({
        data: { adminId: input.adminId, roleId: input.roleId, assignedBy: null },
      });

      return { success: true };
    }),

  removeRole: permissionProcedure(Permission.admin.manage_roles)
    .input(z.object({ adminId: z.string(), roleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent removing own admin role
      if (input.adminId === (ctx as any).user?.id) {
        const role = await ctx.prisma.role.findUnique({ where: { id: input.roleId } });
        if (role && role.level <= 10) {
          throw new ForbiddenBusinessException(
            'Cannot remove your own admin role',
            ErrorCodes.ADMIN_CANNOT_DEACTIVATE_SELF,
          );
        }

        const remainingRoles = await ctx.prisma.adminRole.count({
          where: {
            adminId: input.adminId,
            roleId: { not: input.roleId },
            role: { level: { lte: 10 } },
          },
        });
        if (remainingRoles === 0) {
          throw new ForbiddenBusinessException(
            'Cannot remove your last admin role',
            ErrorCodes.ADMIN_CANNOT_DEACTIVATE_SELF,
          );
        }
      }

      await ctx.prisma.adminRole.delete({
        where: { adminId_roleId: { adminId: input.adminId, roleId: input.roleId } },
      });

      return { success: true };
    }),

  resetPassword: permissionProcedure(Permission.admin.update)
    .input(z.object({ adminId: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await ctx.prisma.admin.update({
        where: { id: input.adminId },
        data: { passwordHash },
      });
      return { success: true };
    }),
});
