import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { PermissionKey } from '@loom/shared';

interface PermissionGuardProps {
  /** 权限字符串（推荐用法）例如 Permission.role.create */
  permission?: PermissionKey;
  /** 资源名（兼容旧用法） */
  resource?: string;
  /** 操作名（兼容旧用法） */
  action?: string;
  /** 无权限时渲染的回退内容（默认 null，即隐藏） */
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  resource,
  action,
  fallback = null,
  children,
}) => {
  const { user } = useAuth();

  const checkPermission = (): boolean => {
    if (!user?.permissions) return false;

    // 新用法：直接传入 permission 字符串
    if (permission) {
      return user.permissions.includes(permission);
    }

    // 旧用法：resource + action
    if (resource && action) {
      return user.permissions.includes(`${resource}:${action}`);
    }

    // 没有指定权限要求，默认放行
    return true;
  };

  if (!checkPermission()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  roles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, fallback = null, children }) => {
  const { user } = useAuth();

  const hasRole = (roleName: string) => {
    if (!user?.roles) return false;
    return user.roles.some((r: any) => r.role.slug === roleName);
  };

  if (!roles.some((role) => hasRole(role))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
