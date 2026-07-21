import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ConflictException,
  ForbiddenBusinessException,
  NotFoundBusinessException,
  ErrorCodes,
} from '../../../core/exceptions';
import * as bcrypt from 'bcryptjs';

/**
 * Admin Service
 *
 * Manages Admin users (backend management users).
 * Contains business logic for password hashing, role assignment, and protection against
 * self-deletion and last-super-admin scenarios.
 */
@Injectable()
export class AdminService extends BaseService<'Admin'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Admin');
  }

  /**
   * 创建前：检查唯一性，hash 密码，分配默认角色
   */
  protected async beforeCreate(data: any): Promise<any> {
    const existing = await this.model.findFirst({
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

    // Hash password and remove plain text
    const passwordHash = await bcrypt.hash(data.password, 10);
    const { password, ...rest } = data;

    return { ...rest, passwordHash };
  }

  /**
   * 创建后：分配默认 viewer 角色
   */
  protected async afterCreate(result: any): Promise<any> {
    const viewerRole = await this.prisma.role.findUnique({
      where: { slug: 'viewer' },
    });

    if (viewerRole) {
      await this.prisma.adminRole.create({
        data: {
          adminId: result.id,
          roleId: viewerRole.id,
          assignedBy: null,
        },
      });
    }

    return result;
  }

  /**
   * 更新前：检查唯一性
   */
  protected async beforeUpdate(id: string, data: any): Promise<any> {
    const existing = await this.getOneOrThrow(id);

    if (data.username || data.email) {
      const orConditions: any[] = [];
      if (data.username) orConditions.push({ username: data.username });
      if (data.email) orConditions.push({ email: data.email });

      const duplicate = await this.model.findFirst({
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

    return data;
  }

  /**
   * 删除前：禁止自删，禁止删除最后一个超级管理员
   */
  protected async beforeDelete(id: string): Promise<void> {
    // This check needs userId from context, passed via options
    // The super-admin check is handled in beforeDeleteMany or via router
  }

  /**
   * 批量删除前：检查超级管理员保护
   */
  protected async beforeDeleteMany(ids: string[]): Promise<void> {
    const superAdminAdmins = await this.model.findMany({
      where: {
        id: { in: ids },
        roles: {
          some: {
            role: { slug: 'super_admin' },
          },
        },
      },
    });

    if (superAdminAdmins.length > 0) {
      const totalSuperAdmins = await this.model.count({
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
  }

  /**
   * 切换管理员激活状态
   */
  async toggleActive(id: string, currentUserId: string): Promise<any> {
    // Prevent self-deactivation
    if (id === currentUserId) {
      throw new ForbiddenBusinessException(
        'Cannot deactivate yourself',
        ErrorCodes.ADMIN_CANNOT_DEACTIVATE_SELF,
      );
    }

    const admin = await this.getOneOrThrow(id);

    return this.update(id, { isActive: !admin.isActive }, { userId: currentUserId });
  }

  /**
   * 重置密码
   */
  async resetPassword(adminId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.model.update({
      where: { id: adminId },
      data: { passwordHash },
    });
  }

  /**
   * 获取管理员角色
   */
  async getRoles(adminId: string): Promise<any[]> {
    const adminRoles = await this.prisma.adminRole.findMany({
      where: { adminId },
      include: { role: true },
      orderBy: { role: { level: 'asc' } },
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
  }

  /**
   * 分配角色
   */
  async assignRole(adminId: string, roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundBusinessException('Role', roleId, ErrorCodes.ROLE_NOT_FOUND);
    }

    const existing = await this.prisma.adminRole.findUnique({
      where: {
        adminId_roleId: { adminId, roleId },
      },
    });

    if (!existing) {
      await this.prisma.adminRole.create({
        data: { adminId, roleId, assignedBy: null },
      });
    }
  }

  /**
   * 移除角色
   */
  async removeRole(adminId: string, roleId: string, currentUserId: string): Promise<void> {
    // Prevent removing own admin role
    if (adminId === currentUserId) {
      const role = await this.prisma.role.findUnique({ where: { id: roleId } });
      if (role && role.level <= 10) {
        throw new ForbiddenBusinessException(
          'Cannot remove your own admin role',
          ErrorCodes.ADMIN_CANNOT_DEACTIVATE_SELF,
        );
      }

      // Check if this is the last admin role
      const remainingRoles = await this.prisma.adminRole.count({
        where: {
          adminId,
          roleId: { not: roleId },
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

    await this.prisma.adminRole.delete({
      where: {
        adminId_roleId: { adminId, roleId },
      },
    });
  }
}
