import { z } from 'zod';

// ============================================
// Permission Registry（类型安全权限定义单一真理源）
// ============================================

import { Permission as PermissionValue } from './permissions/registry';
export { PermissionValue as Permission };
import type {
  PermissionKey as PK,
  PermissionResource as PR,
  PermissionAction as PA,
} from './permissions/registry';
export type { PK as PermissionKey, PR as PermissionResource, PA as PermissionAction };
import type { PermissionConfig as PC } from './permissions/types';
export type { PC as PermissionConfig };
import { getAllPermissionEntries as GAPE, generateSeedSql as GSS } from './permissions/seed';
export { GAPE as getAllPermissionEntries, GSS as generateSeedSql };
import type { PermissionEntry as PE } from './permissions/seed';
export type { PE as PermissionEntry };

// ============================================
// Auth Schemas
// ============================================

export const LoginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

export const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// ============================================
// User & Role Types
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
  permissions: string[]; // Format: "resource:action"
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: Date;
}

// ============================================
// Auth Response Types
// ============================================

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Permission Constants（向后兼容别名）
// ============================================

/**
 * @deprecated 请使用 `Permission` 常量替代
 * 例如: `Permission.role.read` 替代 `PERMISSIONS.ROLE.READ`
 */
export const PERMISSIONS = PermissionValue;

/**
 * @deprecated 请使用 `PermissionKey` 类型替代
 */
export type PermissionString = PK;

// ============================================
// Role Constants
// ============================================

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

// ============================================
// User Management Schemas
// ============================================

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean(),
  emailVerified: z.date().optional().nullable(),
  lastLoginAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  email: z.string().email('邮箱格式无效'),
  password: z.string().min(8, '密码至少8个字符'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UserListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  roleSlug: z.string().optional(),
});

export const AssignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});

export const BatchAssignRolesSchema = z.object({
  userIds: z.array(z.string()),
  roleIds: z.array(z.string()),
});

export const ResetPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(8, '密码至少8个字符'),
});

export type UserInput = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserListQueryInput = z.infer<typeof UserListQuerySchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
export type BatchAssignRolesInput = z.infer<typeof BatchAssignRolesSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ============================================
// Role Management Schemas
// ============================================

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  level: z.number(),
  isSystem: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  slug: z.string().min(1, '角色标识不能为空'),
  description: z.string().optional(),
  level: z.number().int().default(100),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  level: z.number().int().optional(),
});

export const RoleListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  search: z.string().optional(),
});

export const UpdateRolePermissionsSchema = z.object({
  roleId: z.string(),
  permissionIds: z.array(z.string()),
});

export type RoleInput = z.infer<typeof RoleSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type RoleListQueryInput = z.infer<typeof RoleListQuerySchema>;
export type UpdateRolePermissionsInput = z.infer<typeof UpdateRolePermissionsSchema>;

// ============================================
// Agent CRUD Schemas（LLM 配置）
// ============================================

export const CreateAgentSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  slug: z.string().min(1, '标识不能为空'),
  description: z.string().optional(),
  icon: z.string().optional(),
  model: z.string().optional().default('gpt-4o'),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  provider: z.string().optional().default('openai'),
  apiUrl: z.string().optional(),
  apiKey: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  sort: z.number().int().optional().default(0),
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().nullable().optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  maxTokens: z.number().int().positive().nullable().optional(),
  provider: z.string().optional(),
  apiUrl: z.string().nullable().optional(),
  apiKey: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;

// ============================================
// WeCom (企业微信) Schemas
// ============================================

export const CreateWecomConfigSchema = z.object({
  name: z.string().min(1, '应用名称不能为空'),
  corpId: z.string().min(1, '企业ID不能为空'),
  agentId: z.number().int().positive('AgentId必须为正整数'),
  secret: z.string().min(1, 'Secret不能为空'),
  token: z.string().min(1, 'Token不能为空'),
  encodingAESKey: z.string().length(43, 'EncodingAESKey必须为43个字符'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateWecomConfigSchema = z.object({
  name: z.string().min(1).optional(),
  corpId: z.string().min(1).optional(),
  agentId: z.number().int().positive().optional(),
  secret: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
  encodingAESKey: z.string().length(43).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const SendMessageSchema = z.object({
  configId: z.string().min(1),
  toUser: z.string().optional(),
  toParty: z.string().optional(),
  toTag: z.string().optional(),
  msgType: z.enum([
    'text',
    'image',
    'voice',
    'video',
    'file',
    'textcard',
    'news',
    'mpnews',
    'markdown',
    'miniprogram_notice',
    'template_card',
  ]),
  content: z.record(z.string(), z.any()),
});

export const SendKfMessageSchema = z.object({
  configId: z.string().min(1),
  kfAccount: z.string().min(1),
  toUser: z.string().min(1),
  msgType: z.enum(['text', 'image', 'voice', 'video', 'file', 'link', 'miniprogram', 'menu']),
  content: z.record(z.string(), z.any()),
});

export const SyncKfMessageSchema = z.object({
  configId: z.string().min(1),
  kfAccount: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(1000),
});

export type CreateWecomConfigInput = z.infer<typeof CreateWecomConfigSchema>;
export type UpdateWecomConfigInput = z.infer<typeof UpdateWecomConfigSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type SendKfMessageInput = z.infer<typeof SendKfMessageSchema>;
export type SyncKfMessageInput = z.infer<typeof SyncKfMessageSchema>;

// ============================================
// Todo Schemas
// ============================================
// Todo 作为参考模块，展示了完整的 Zod Schema 写法：
//   - CreateSchema：创建时的必填字段和可选字段
//   - UpdateSchema：更新时的所有可选字段（部分更新）
//   - Schema：完整的数据库模型定义（用于前端展示）
//   - ListQuerySchema：列表查询参数（分页 + 搜索 + 筛选）

export const TodoStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TodoStatusType = (typeof TodoStatus)[keyof typeof TodoStatus];

export const TodoPriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const;

export type TodoPriorityType = (typeof TodoPriority)[keyof typeof TodoPriority];

/**
 * 完整的 Todo 模型，用于详情展示
 */
export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.number().int().min(0).max(2),
  dueDate: z.date().nullable().optional(),
  isCompleted: z.boolean(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable().optional(),
});

/**
 * 创建 Todo 时提交的数据
 * 必填：title
 * 可选：description, status, priority, dueDate
 * 自动填充：userId（从 JWT 中获取）
 */
export const CreateTodoSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  description: z.string().max(1000, '描述不能超过1000个字符').optional().nullable(),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .optional()
    .default('pending'),
  priority: z.number().int().min(0).max(2).optional().default(0),
  dueDate: z.date().optional().nullable(),
  isCompleted: z.boolean().optional().default(false),
});

/**
 * 更新 Todo 时提交的数据
 * 所有字段均为可选（部分更新）
 */
export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.number().int().min(0).max(2).optional(),
  dueDate: z.date().nullable().optional(),
  isCompleted: z.boolean().optional(),
});

/**
 * Todo 列表查询参数
 * 支持分页 + 关键字搜索 + 状态/优先级筛选
 */
export const TodoListQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.number().int().optional(),
  isCompleted: z.boolean().optional(),
});

export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
export type TodoListQueryInput = z.infer<typeof TodoListQuerySchema>;
