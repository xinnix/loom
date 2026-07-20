import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../modules/auth/decorators/decorators';
import type { PermissionKey } from '@loom/shared';
import { hasSuperAdminRole } from '../../shared/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.permissions) {
      return false;
    }

    // super_admin 跳过权限检查
    if (hasSuperAdminRole(user)) {
      return true;
    }

    // 需要用户拥有所有列出的权限
    const userPermSet = new Set<string>(user.permissions);
    return requiredPermissions.every((p) => userPermSet.has(p));
  }
}
