import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PermissionKey } from '@loom/shared';

// 🔓 公开接口装饰器
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// 👤 当前用户装饰器
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

// 🔑 权限装饰器
export const PERMISSIONS_KEY = 'permissions';

/**
 * 要求特定权限。
 *
 * 使用方式:
 *   @RequirePermissions(Permission.admin.read)           // 单个权限
 *   @RequirePermissions(Permission.admin.read, Permission.user.update) // 或多个
 *
 * 兼容旧语法:
 *   @RequirePermissions('admin:read')
 */
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// 👔 角色装饰器
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
