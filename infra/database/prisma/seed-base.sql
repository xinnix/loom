-- ============================================
-- 1. 创建权限数据
-- ============================================
INSERT INTO permissions (id, resource, action, description)
VALUES
  -- Admin CRUD
  ('p1', 'admin', 'create', '创建管理员'),
  ('p2', 'admin', 'read', '查看管理员'),
  ('p3', 'admin', 'update', '更新管理员'),
  ('p4', 'admin', 'delete', '删除管理员'),
  -- User CRUD
  ('p5', 'user', 'create', '创建用户'),
  ('p6', 'user', 'read', '查看用户'),
  ('p7', 'user', 'update', '更新用户'),
  ('p8', 'user', 'delete', '删除用户'),
  -- Role CRUD
  ('p9', 'role', 'create', '创建角色'),
  ('p10', 'role', 'read', '查看角色'),
  ('p11', 'role', 'update', '更新角色'),
  ('p12', 'role', 'delete', '删除角色'),
  -- Agent CRUD
  ('p13', 'agent', 'create', '创建 Agent'),
  ('p14', 'agent', 'read', '查看 Agent'),
  ('p15', 'agent', 'update', '更新 Agent'),
  ('p16', 'agent', 'delete', '删除 Agent'),
  -- WeCom CRUD
  ('p17', 'wecom', 'create', '创建企微配置'),
  ('p18', 'wecom', 'read', '查看企微配置'),
  ('p19', 'wecom', 'update', '更新企微配置'),
  ('p20', 'wecom', 'delete', '删除企微配置'),
  -- LLM 配置 CRUD（registry 已有，此前 seed 漏配——2026-10-14 补）
  ('p25', 'llmConfig', 'create', '创建模型配置'),
  ('p26', 'llmConfig', 'read', '查看模型配置'),
  ('p27', 'llmConfig', 'update', '更新模型配置'),
  ('p28', 'llmConfig', 'delete', '删除模型配置'),
  -- AI 工具与 Agent 运行
  ('p29', 'aiTool', 'read', '查看 AI 工具'),
  ('p30', 'agent', 'run', '运行 Agent'),
  -- AI 用量看板（ADR-007）
  ('p31', 'llmusage', 'read', '查看 AI 用量看板'),
  -- 平台参数中心（ADR-008）
  ('p39', 'settings', 'read', '查看平台参数'),
  ('p40', 'settings', 'update', '修改平台参数'),
  -- 变更日志（ADR-010）
  ('p48', 'changelog', 'read', '查看更新日志'),
  -- Agent 定时触发（ADR-009）
  ('p42', 'agentTrigger', 'create', '创建触发器'),
  ('p43', 'agentTrigger', 'read', '查看触发器'),
  ('p44', 'agentTrigger', 'update', '更新触发器'),
  ('p45', 'agentTrigger', 'delete', '删除触发器'),
  ('p46', 'agentTrigger', 'run', '手动执行触发器'),
  -- Menu visibility
  ('p32', 'menu', 'agents', 'Agent 管理菜单'),
  ('p33', 'menu', 'admins', '管理员管理菜单'),
  ('p34', 'menu', 'roles', '角色管理菜单'),
  ('p35', 'menu', 'wecom', '企业微信菜单'),
  ('p36', 'menu', 'llmConfigs', '模型配置菜单'),
  ('p37', 'menu', 'aiTools', 'AI 工具菜单'),
  ('p38', 'menu', 'llmUsage', 'AI 用量菜单'),
  ('p41', 'menu', 'settings', '平台参数菜单'),
  ('p47', 'menu', 'agentTriggers', '定时触发菜单'),
  ('p49', 'menu', 'changelog', '更新日志菜单')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================
-- 2. 创建角色数据
-- ============================================
INSERT INTO roles (id, name, slug, description, level, "isSystem", "createdAt", "updatedAt")
VALUES
  ('r1', '超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', 0, true, NOW(), NOW()),
  ('r2', '管理员', 'admin', '系统管理员', 100, true, NOW(), NOW()),
  ('r3', '访客', 'viewer', '只读权限管理员', 200, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. 分配权限给角色
-- ============================================
-- 超级管理员拥有所有权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r1', 'r1', permissions.id, NOW() FROM permissions
ON CONFLICT DO NOTHING;

-- 管理员拥有非删除权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r2', 'r2', permissions.id, NOW() FROM permissions
WHERE action != 'delete'
ON CONFLICT DO NOTHING;

-- 访客拥有读权限 + 菜单权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r3', 'r3', permissions.id, NOW() FROM permissions
WHERE action = 'read' OR resource = 'menu'
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 创建管理员用户
-- ============================================
-- 密码: password123 (bcrypt hash)
INSERT INTO admins (id, username, email, "passwordHash", "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES
  ('a1', 'superadmin', 'superadmin@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Super', 'Admin', true, NOW(), NOW()),
  ('a2', 'admin', 'admin@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Admin', 'User', true, NOW(), NOW()),
  ('a3', 'viewer', 'viewer@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Viewer', 'Admin', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 分配角色给管理员
INSERT INTO admin_roles (id, "adminId", "roleId", "assignedAt")
VALUES
  ('ar1', 'a1', 'r1', NOW()),
  ('ar2', 'a2', 'r2', NOW()),
  ('ar3', 'a3', 'r3', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 创建小程序用户
-- ============================================
INSERT INTO users (id, username, email, "passwordHash", nickname, phone, "isActive", "createdAt", "updatedAt")
VALUES
  ('u1', 'user', 'user@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', '测试用户', '13800138000', true, NOW(), NOW()),
  ('u2', 'user2', 'user2@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', '测试用户2', NULL, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
