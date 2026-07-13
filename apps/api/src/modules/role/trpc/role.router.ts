import { z } from 'zod';
import {
  CreateRoleSchema,
  UpdateRoleSchema,
  UpdateRolePermissionsSchema,
} from '@roundtable/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure, publicProcedure } from '../../../trpc/trpc';
import {
  NotFoundBusinessException,
  ConflictException,
  ForbiddenBusinessException,
  ErrorCodes,
} from '../../../core/exceptions';

const roleGetManySchema = z
  .object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    search: z.string().optional(),
    where: z.any().optional(),
    orderBy: z.any().optional(),
  })
  .optional();

export const roleRouter = createCrudRouterWithCustom(
  'Role',
  {
    create: CreateRoleSchema,
    update: UpdateRoleSchema,
  },
  () => ({
    getMany: publicProcedure.input(roleGetManySchema).query(async ({ ctx, input }) => {
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

      const [roles, total] = await Promise.all([
        ctx.prisma.role.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: input?.orderBy || { level: 'asc' },
          include: {
            _count: {
              select: {
                admins: true,
                permissions: true,
              },
            },
          },
        }),
        ctx.prisma.role.count({ where }),
      ]);

      return {
        items: roles.map((role) => ({
          ...role,
          _count: {
            users: role._count.admins,
            permissions: role._count.permissions,
          },
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

    getOne: permissionProcedure('role', 'read')
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const role = await ctx.prisma.role.findUnique({
          where: { id: input.id },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            _count: {
              select: {
                admins: true,
                permissions: true,
              },
            },
          },
        });

        if (!role) {
          throw new NotFoundBusinessException('Role', input.id, ErrorCodes.ROLE_NOT_FOUND);
        }

        return {
          ...role,
          permissions: role.permissions.map((item) => item.permission),
          _count: {
            users: role._count.admins,
            permissions: role._count.permissions,
          },
        };
      }),

    create: permissionProcedure('role', 'create')
      .input(
        z.object({
          data: CreateRoleSchema,
          include: z.any().optional(),
          select: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data } = input;

        const existing = await ctx.prisma.role.findUnique({
          where: { slug: data.slug },
        });
        if (existing) {
          throw new ConflictException('Role slug already exists', ErrorCodes.ROLE_SLUG_EXISTS);
        }

        return ctx.prisma.role.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            level: data.level,
          },
          include: input.include,
          select: input.select,
        });
      }),

    update: permissionProcedure('role', 'update')
      .input(
        z.object({
          id: z.string(),
          data: UpdateRoleSchema,
          include: z.any().optional(),
          select: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { id, data } = input;

        const existing = await ctx.prisma.role.findUnique({
          where: { id },
        });
        if (!existing) {
          throw new NotFoundBusinessException('Role', id, ErrorCodes.ROLE_NOT_FOUND);
        }

        if (existing.isSystem && data.level !== undefined) {
          throw new ForbiddenBusinessException(
            'Cannot modify level of system role',
            ErrorCodes.ROLE_IS_SYSTEM,
          );
        }

        return ctx.prisma.role.update({
          where: { id },
          data,
          include: input.include,
          select: input.select,
        });
      }),

    delete: permissionProcedure('role', 'delete')
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const role = await ctx.prisma.role.findUnique({
          where: { id: input.id },
          include: {
            admins: {
              select: { id: true },
              take: 1,
            },
          },
        });

        if (!role) {
          throw new NotFoundBusinessException('Role', input.id, ErrorCodes.ROLE_NOT_FOUND);
        }
        if (role.isSystem) {
          throw new ForbiddenBusinessException(
            'Cannot delete system role',
            ErrorCodes.ROLE_IS_SYSTEM,
          );
        }
        if (role.admins.length > 0) {
          throw new ForbiddenBusinessException(
            'Cannot delete role that is assigned to users',
            ErrorCodes.ROLE_HAS_ADMINS,
          );
        }

        await ctx.prisma.role.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    deleteMany: permissionProcedure('role', 'delete')
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        const roles = await ctx.prisma.role.findMany({
          where: { id: { in: input.ids } },
          include: {
            admins: {
              select: { id: true },
              take: 1,
            },
          },
        });

        if (roles.some((role) => role.isSystem)) {
          throw new ForbiddenBusinessException(
            'Cannot delete system role',
            ErrorCodes.ROLE_IS_SYSTEM,
          );
        }
        if (roles.some((role) => role.admins.length > 0)) {
          throw new ForbiddenBusinessException(
            'Cannot delete role that is assigned to users',
            ErrorCodes.ROLE_HAS_ADMINS,
          );
        }

        return ctx.prisma.role.deleteMany({
          where: { id: { in: input.ids } },
        });
      }),

    getPermissions: permissionProcedure('role', 'read')
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const rolePermissions = await ctx.prisma.rolePermission.findMany({
          where: { roleId: input.id },
          include: {
            permission: true,
          },
          orderBy: {
            permission: {
              resource: 'asc',
            },
          },
        });
        return rolePermissions.map((item) => item.permission);
      }),

    getUsers: permissionProcedure('role', 'read')
      .input(
        z.object({
          id: z.string(),
          page: z.number().int().positive().optional(),
          pageSize: z.number().int().positive().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 10;
        const skip = (page - 1) * pageSize;

        const [adminRoles, total] = await Promise.all([
          ctx.prisma.adminRole.findMany({
            where: { roleId: input.id },
            skip,
            take: pageSize,
            orderBy: { assignedAt: 'desc' },
            include: {
              admin: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  isActive: true,
                },
              },
            },
          }),
          ctx.prisma.adminRole.count({ where: { roleId: input.id } }),
        ]);

        return {
          items: adminRoles.map((item) => ({
            ...item.admin,
            assignedAt: item.assignedAt,
          })),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }),

    updatePermissions: permissionProcedure('role', 'update')
      .input(UpdateRolePermissionsSchema)
      .mutation(async ({ ctx, input }) => {
        const { roleId, permissionIds } = input;

        const role = await ctx.prisma.role.findUnique({
          where: { id: roleId },
        });
        if (!role) {
          throw new NotFoundBusinessException('Role', roleId, ErrorCodes.ROLE_NOT_FOUND);
        }

        const permissions = await ctx.prisma.permission.findMany({
          where: { id: { in: permissionIds } },
        });
        if (permissions.length !== permissionIds.length) {
          throw new NotFoundBusinessException(
            'One or more permissions not found',
            undefined,
            ErrorCodes.PERMISSION_NOT_FOUND,
          );
        }

        await ctx.prisma.rolePermission.deleteMany({
          where: { roleId },
        });

        if (permissionIds.length > 0) {
          await ctx.prisma.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId,
              permissionId,
            })),
          });
        }

        return { success: true };
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
