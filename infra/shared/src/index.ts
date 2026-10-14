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
// AI 三层架构 YML 契约（Agent 编排 / 工具声明）
// ============================================

export * from './ai';

// ============================================
// 平台参数配置目录（SystemSetting，ADR-008）
// ============================================

export * from './settings';

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
// Admin Management Schemas
// ============================================

export const AdminSchema = z.object({
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

export const CreateAdminSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  email: z.string().email('邮箱格式无效'),
  password: z.string().min(8, '密码至少8个字符'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateAdminSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const AdminListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  roleSlug: z.string().optional(),
});

export type AdminInput = z.infer<typeof AdminSchema>;
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminInput = z.infer<typeof UpdateAdminSchema>;
export type AdminListQueryInput = z.infer<typeof AdminListQuerySchema>;

// ============================================
// Agent CRUD Schemas（部署期绑定记录，编排定义真理源在 YML）
// ============================================

export const CreateAgentSchema = z.object({
  slug: z.string().min(1, '标识不能为空'),
  name: z.string().min(1, '名称不能为空'),
  description: z.string().optional(),
  icon: z.string().optional(),
  llmConfigId: z.string().optional(),
  tools: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
  sort: z.number().int().optional().default(0),
});

export const UpdateAgentSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  llmConfigId: z.string().nullable().optional(),
  tools: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;

// ============================================
// LlmConfig CRUD Schemas（LLM 配置，apiKey 明文仅作为入参，服务层加密落库）
// ============================================

export const CreateLlmConfigSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  configKey: z
    .string()
    .min(1, '配置键不能为空')
    .regex(/^[a-z0-9][a-z0-9-]*$/, '配置键仅限小写字母/数字/横杠'),
  provider: z.string().optional().default('openai'),
  apiUrl: z.string().optional(),
  /** 明文 apiKey 入参，服务层 AES-256-GCM 加密后存 apiKeyEnc */
  apiKey: z.string().min(1, 'API Key 不能为空'),
  model: z.string().min(1, '模型不能为空'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
  maxRetries: z.number().int().min(0).optional(),
  /** 元/百万 tokens，成本归因用（ADR-007）；空 = 回退全局兜底键 */
  inputPricePer1M: z.number().min(0).optional(),
  outputPricePer1M: z.number().min(0).optional(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  description: z.string().optional(),
});

export const UpdateLlmConfigSchema = z.object({
  name: z.string().min(1).optional(),
  configKey: z.string().min(1).optional(),
  provider: z.string().optional(),
  apiUrl: z.string().nullable().optional(),
  /** 留空/缺省 = 不修改 */
  apiKey: z.string().optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  maxTokens: z.number().int().positive().nullable().optional(),
  timeoutMs: z.number().int().positive().optional(),
  maxRetries: z.number().int().min(0).optional(),
  inputPricePer1M: z.number().min(0).nullable().optional(),
  outputPricePer1M: z.number().min(0).nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  description: z.string().nullable().optional(),
});

export type CreateLlmConfigInput = z.infer<typeof CreateLlmConfigSchema>;
export type UpdateLlmConfigInput = z.infer<typeof UpdateLlmConfigSchema>;

// ============================================
// AgentTrigger Schemas（定时触发，ADR-009）
// ============================================

/** 受限调度白名单形态：HOURLY | DAILY_HH（00-23 任意整点）；非任意 cron 表达式 */
export const AgentTriggerScheduleSchema = z
  .string()
  .regex(/^HOURLY$|^DAILY_(?:[01]\d|2[0-3])$/, '调度仅支持 HOURLY 或 DAILY_HH（整点白名单形态）');

export const CreateAgentTriggerSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  agentSlug: z.string().min(1, 'agent slug 不能为空'),
  schedule: AgentTriggerScheduleSchema,
  input: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional().default(true),
});

export const UpdateAgentTriggerSchema = z.object({
  name: z.string().min(1).optional(),
  agentSlug: z.string().min(1).optional(),
  schedule: AgentTriggerScheduleSchema.optional(),
  input: z.record(z.string(), z.unknown()).nullable().optional(),
  enabled: z.boolean().optional(),
});

export type AgentTriggerSchedule = z.infer<typeof AgentTriggerScheduleSchema>;
export type CreateAgentTriggerInput = z.infer<typeof CreateAgentTriggerSchema>;
export type UpdateAgentTriggerInput = z.infer<typeof UpdateAgentTriggerSchema>;

// ============================================
// Changelog Schemas（变更日志，ADR-010）
// ============================================

/** 条目类型（CHANGELOG.md 分节标题的中英文别名由 API 侧归一） */
export const CHANGELOG_TYPES = ['added', 'changed', 'fixed', 'removed', 'security'] as const;

export const ChangelogTypeSchema = z.enum(CHANGELOG_TYPES);

export const ChangelogGroupSchema = z.object({
  type: ChangelogTypeSchema,
  items: z.array(z.string().min(1)),
});

export const ChangelogEntrySchema = z.object({
  version: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式须为 YYYY-MM-DD'),
  groups: z.array(ChangelogGroupSchema),
});

export const ChangelogQuerySchema = z
  .object({
    type: ChangelogTypeSchema.optional(),
    keyword: z.string().optional(),
  })
  .optional();

export type ChangelogType = z.infer<typeof ChangelogTypeSchema>;
export type ChangelogGroup = z.infer<typeof ChangelogGroupSchema>;
export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

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
