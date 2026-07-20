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
 * Separate from User router (miniapp users).
 */
export const adminRouter = router({
  // Custom getMany with search and role filter
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
      const { search, isActive, roleSlug, ...restWhere } = where;

      // Build Prisma where clause
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
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    level: true,
                  },
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
          roles: admin.roles.map((r) => r.role),
        })),
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // Custom getOne with roles
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
        roles: admin.roles.map((r) => ({
          ...r.role,
          assignedAt: r.assignedAt,
        })),
      };
    }),

  // Custom create with password hashing and default role
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
        include: z.any().optional(),
        select: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data } = input;

      // Check if username or email already exists
      const existing = await ctx.prisma.admin.findFirst({
        where: {
          OR: [{ username: data.username }, { email: data.email }],
        },
      });

      if (existing) {
        throw new ConflictException(
          'Username or email already exists',
          ErrorCodes.ADMIN_ALREADY_EXISTS,
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create admin with default viewer role
      const viewerRole = await ctx.prisma.role.findUnique({
        where: { slug: 'viewer' },
      });

      const admin = await ctx.prisma.admin.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          avatar: data.avatar,
          isActive: data.isActive ?? true,
          roles: viewerRole
            ? {
                create: {
                  roleId: viewerRole.id,
                  assignedBy: null,
                },
              }
            : undefined,
        },
        select: input.select || {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
        include: input.include,
      });

      return admin;
    }),

  // Custom update with validation
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
        include: z.any().optional(),
        select: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Check if admin exists
      const existing = await ctx.prisma.admin.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundBusinessException('Admin', id, ErrorCodes.ADMIN_NOT_FOUND);
      }

      // Check if username/email is taken by another admin
      if (data.username || data.email) {
        const orConditions: any[] = [];
        if (data.username) orConditions.push({ username: data.username });
        if (data.email) orConditions.push({ email: data.email });

        const duplicate = await ctx.prisma.admin.findFirst({
          where: {
            AND: [{ id: { not: id } }, { OR: orConditions }],
          },
        });

        if (duplicate) {
          throw new ConflictException(
            'Username or email already exists',
            ErrorCodes.ADMIN_ALREADY_EXISTS,
          );
        }
      }

      const admin = await ctx.prisma.admin.update({
        where: { id },
        data,
        select: input.select || {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          updatedAt: true,
        },
        include: input.include,
      });

      return admin;
    }),

  // Custom delete with protection for last super admin
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
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!admin) {
        throw new NotFoundBusinessException('Admin', input.id, ErrorCodes.ADMIN_NOT_FOUND);
      }

      // Check if admin is the last super admin
      const hasSuperAdmin = admin.roles.some((ar) => ar.role.slug === 'super_admin');
      if (hasSuperAdmin) {
        const superAdminCount = await ctx.prisma.admin.count({
          where: {
            roles: {
              some: {
                role: { slug: 'super_admin' },
              },
            },
          },
        });

        if (superAdminCount <= 1) {
          throw new ForbiddenBusinessException(
            'Cannot delete the last super admin',
            ErrorCodes.ADMIN_LAST_SUPER_ADMIN,
          );
        }
      }

      // Delete admin using a transaction to handle foreign key constraints
      await ctx.prisma.$transaction(async (tx) => {
        // 1. Remove admin from all roles
        await tx.adminRole.deleteMany({
          where: { adminId: input.id },
        });

        // 2. Handle refresh tokens
        await tx.adminRefreshToken.deleteMany({
          where: { adminId: input.id },
        });

        // 3. Finally delete the admin
        await tx.admin.delete({
          where: { id: input.id },
        });
      });

      return { success: true };
    }),

  // Custom deleteMany with protection
  deleteMany: permissionProcedure(Permission.admin.delete)
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { ids } = input;

      // Filter out self
      const filteredIds = ids.filter((id) => id !== (ctx as any).user?.id);

      if (filteredIds.length === 0) {
        throw new ForbiddenBusinessException(
          'Cannot delete yourself',
          ErrorCodes.ADMIN_CANNOT_DELETE_SELF,
        );
      }

      // Check for last super admin
      const superAdminAdmins = await ctx.prisma.admin.findMany({
        where: {
          id: { in: filteredIds },
          roles: {
            some: {
              role: { slug: 'super_admin' },
            },
          },
        },
      });

      if (superAdminAdmins.length > 0) {
        const totalSuperAdmins = await ctx.prisma.admin.count({
          where: {
            roles: {
              some: {
                role: { slug: 'super_admin' },
              },
            },
          },
        });

        if (totalSuperAdmins <= superAdminAdmins.length) {
          throw new ForbiddenBusinessException(
            'Cannot delete all super admins',
            ErrorCodes.ADMIN_LAST_SUPER_ADMIN,
          );
        }
      }

      // Delete admins using a transaction to handle foreign key constraints
      let deletedCount = 0;
      for (const adminId of filteredIds) {
        await ctx.prisma.$transaction(async (tx) => {
          // 1. Remove admin from all roles
          await tx.adminRole.deleteMany({
            where: { adminId },
          });

          // 2. Handle refresh tokens
          await tx.adminRefreshToken.deleteMany({
            where: { adminId },
          });

          // 3. Delete the admin
          await tx.admin.delete({
            where: { id: adminId },
          });
        });
        deletedCount++;
      }

      return { success: true, count: deletedCount };
    }),

  // Toggle admin active status
  toggleActive: permissionProcedure(Permission.admin.update)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deactivation
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

      const updatedAdmin = await ctx.prisma.admin.update({
        where: { id: input.id },
        data: { isActive: !admin.isActive },
        select: {
          id: true,
          isActive: true,
        },
      });

      return updatedAdmin;
    }),

  // Get admin roles
  getRoles: permissionProcedure(Permission.admin.read)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const adminRoles = await ctx.prisma.adminRole.findMany({
        where: { adminId: input.id },
        include: {
          role: true,
        },
        orderBy: {
          role: { level: 'asc' },
        },
      });

      return adminRoles.map((ar) => ({
        id: ar.role.id,
        name: ar.role.name,
        slug: ar.role.slug,
        level: ar.role.level,
        description: ar.role.description,
        isSystem: ar.role.isSystem,
        assignedAt: ar.assignedAt,
      }));
    }),

  // Assign role to admin
  assignRole: permissionProcedure(Permission.admin.manage_roles)
    .input(
      z.object({
        adminId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if role exists
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
      });

      if (!role) {
        throw new NotFoundBusinessException('Role', input.roleId, ErrorCodes.ROLE_NOT_FOUND);
      }

      // Check if admin already has this role
      const existing = await ctx.prisma.adminRole.findUnique({
        where: {
          adminId_roleId: {
            adminId: input.adminId,
            roleId: input.roleId,
          },
        },
      });

      if (existing) {
        return { success: true, message: '管理员已拥有该角色' };
      }

      await ctx.prisma.adminRole.create({
        data: {
          adminId: input.adminId,
          roleId: input.roleId,
          assignedBy: null,
        },
      });

      return { success: true };
    }),

  // Remove role from admin
  removeRole: permissionProcedure(Permission.admin.manage_roles)
    .input(
      z.object({
        adminId: z.string(),
        roleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent removing own admin roles
      if (input.adminId === (ctx as any).user?.id) {
        const role = await ctx.prisma.role.findUnique({
          where: { id: input.roleId },
        });

        if (role && role.level <= 10) {
          throw new ForbiddenBusinessException(
            'Cannot remove your own admin role',
            ErrorCodes.ADMIN_CANNOT_DEACTIVATE_SELF,
          );
        }
      }

      // Check if removing last admin role
      if (input.adminId === (ctx as any).user?.id) {
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
        where: {
          adminId_roleId: {
            adminId: input.adminId,
            roleId: input.roleId,
          },
        },
      });

      return { success: true };
    }),

  // Reset admin password
  resetPassword: permissionProcedure(Permission.admin.update)
    .input(
      z.object({
        adminId: z.string(),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 10);

      await ctx.prisma.admin.update({
        where: { id: input.adminId },
        data: { passwordHash },
      });

      return { success: true };
    }),
});
