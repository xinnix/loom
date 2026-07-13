// apps/api/src/shared/permissions.ts
import { User } from '@roundtable/shared';

/**
 * 基础权限检查工具
 */

export function hasSuperAdminRole(user: User | null): boolean {
  return user?.roles?.some((r) => r.slug === 'super_admin') || false;
}

export function hasAdminRole(user: User | null): boolean {
  return user?.roles?.some((r) => r.slug === 'admin') || false;
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (hasSuperAdminRole(user)) return true;
  return user.permissions?.includes(permission) || false;
}
