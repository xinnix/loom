import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  NotFoundBusinessException,
  ConflictException,
  ForbiddenBusinessException,
  ErrorCodes,
} from '../../../core/exceptions';

/**
 * Role Service
 *
 * 角色管理的业务逻辑层。
 * 通过 BaseService 生命周期钩子实现系统角色保护和数据校验。
 */
@Injectable()
export class RoleService extends BaseService<'Role'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Role');
  }

  /**
   * 创建前：检查 slug 唯一性
   */
  protected async beforeCreate(data: any): Promise<any> {
    const existing = await this.model.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException('Role slug already exists', ErrorCodes.ROLE_SLUG_EXISTS);
    }
    return data;
  }

  /**
   * 更新前：禁止修改系统角色的 level
   */
  protected async beforeUpdate(id: string, data: any): Promise<any> {
    const existing = await this.getOneOrThrow(id);

    if (existing.isSystem && data.level !== undefined) {
      throw new ForbiddenBusinessException(
        'Cannot modify level of system role',
        ErrorCodes.ROLE_IS_SYSTEM,
      );
    }

    return data;
  }

  /**
   * 删除前：禁止删除系统角色，禁止删除有用户的角色
   */
  protected async beforeDelete(id: string): Promise<void> {
    const role = await this.getOneOrThrow(id);

    if (role.isSystem) {
      throw new ForbiddenBusinessException('Cannot delete system role', ErrorCodes.ROLE_IS_SYSTEM);
    }

    const adminCount = await this.prisma.adminRole.count({
      where: { roleId: id },
    });

    if (adminCount > 0) {
      throw new ForbiddenBusinessException(
        'Cannot delete role that is assigned to users',
        ErrorCodes.ROLE_HAS_ADMINS,
      );
    }
  }

  /**
   * 批量删除前：检查系统角色和已分配角色
   */
  protected async beforeDeleteMany(ids: string[]): Promise<void> {
    const roles = await this.model.findMany({
      where: { id: { in: ids } },
      select: { id: true, isSystem: true },
    });

    if (roles.some((r: any) => r.isSystem)) {
      throw new ForbiddenBusinessException('Cannot delete system role', ErrorCodes.ROLE_IS_SYSTEM);
    }

    const assignedCount = await this.prisma.adminRole.count({
      where: { roleId: { in: ids } },
    });

    if (assignedCount > 0) {
      throw new ForbiddenBusinessException(
        'Cannot delete role that is assigned to users',
        ErrorCodes.ROLE_HAS_ADMINS,
      );
    }
  }
}
