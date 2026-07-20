/**
 * Permission Registry - 类型安全的权限定义单一真理源
 *
 * 所有权限集中定义在此。新增模块时在此添加一行，
 * 前端和后端自动获得类型安全和编译期校验。
 *
 * 格式: resource: { action: 'resource:action' }
 * 使用: permissionProcedure(Permission.role.read)
 */

export const Permission = {
  admin: {
    create: 'admin:create',
    read: 'admin:read',
    update: 'admin:update',
    delete: 'admin:delete',
    manage_roles: 'admin:manage_roles',
  },
  user: {
    create: 'user:create',
    read: 'user:read',
    update: 'user:update',
    delete: 'user:delete',
  },
  role: {
    create: 'role:create',
    read: 'role:read',
    update: 'role:update',
    delete: 'role:delete',
  },
  agent: {
    create: 'agent:create',
    read: 'agent:read',
    update: 'agent:update',
    delete: 'agent:delete',
  },
  wecom: {
    create: 'wecom:create',
    read: 'wecom:read',
    update: 'wecom:update',
    delete: 'wecom:delete',
  },
  todo: {
    create: 'todo:create',
    read: 'todo:read',
    update: 'todo:update',
    delete: 'todo:delete',
  },
  menu: {
    agents: 'menu:agents',
    admins: 'menu:admins',
    roles: 'menu:roles',
    wecom: 'menu:wecom',
  },
} as const;

// ============================================
// 派生类型 —— 自动从 registry 推导
// ============================================

/**
 * 所有权限字符串的联合类型
 * 例如: "admin:create" | "role:read" | "menu:agents" | ...
 */
export type PermissionKey = {
  [R in keyof typeof Permission]: (typeof Permission)[R][keyof (typeof Permission)[R]];
}[keyof typeof Permission];

/**
 * 权限资源名称的联合类型
 * 例如: "admin" | "user" | "role" | ...
 */
export type PermissionResource = keyof typeof Permission;

/**
 * 给定资源的操作类型的联合
 */
export type PermissionAction<R extends PermissionResource> = keyof (typeof Permission)[R];

// ============================================
// 向后兼容别名（旧代码可逐步迁移）
// ============================================

/** @deprecated 请使用 Permission 常量 */
export const PERMISSIONS_BY_RESOURCE = Permission;
