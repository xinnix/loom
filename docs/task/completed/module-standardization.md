# 任务：模块标准化推广 — Agents / User / Role

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-07-20
- **标签**：`refactor`
- **关联**：[未来方向文档](../../future-directions.md)

## 目标

将 Agents、User、Role 三个 Admin 模块的手写页面改造成 StandardListPage + StandardForm + StandardDetailPage 标准模式，减少重复代码，统一管理风格。

## 检查清单

### 第一阶段：Agents 模块 (P1)

- [x] 分析 Agents 模块现状，识别特殊业务逻辑（温度 Slider 需 custom 类型）
- [x] Agents 列表页改造为 StandardListPage（搜索 + 详情导航）
- [x] Agents 表单改造为 StandardForm（11 字段，含温度 Slider 自定义渲染）
- [x] Agents 详情页新增（StandardDetailPage，apiKey 加密显示）
- [x] 修复 pages/index.ts 死导出（移除 AgentChatPage），注册路由
- [x] 模块导出更新，含 Model/Provider 常量
- [x] 类型检查通过，零错误

### 第二阶段：User 模块 (P2)

- [x] 分析：User 只读列表，无 create/delete 操作；RoleAssignmentModal 不可用（API 在 admin 路由）
- [x] User 列表页改造为 StandardListPage（只读，无 create 按钮，详情导航）
- [x] User 表单改造为 StandardForm（字段定义，当前未路由使用但有参考价值）
- [x] User 详情页改造为 StandardDetailPage（不含 RoleAssignmentModal — 该组件调用 user.assignRole 不存在于 API）
- [x] 类型检查通过，零错误

### 第三阶段：Role 模块 (P2)

- [x] 分析：Role 只允许编辑（无创建/删除），配置权限树为自定义组件；详情页三标签页（info/permissions/users）呈高度定制
- [x] Role 列表页改造为 StandardListPage（名称可点击跳转详情，默认编辑，无创建按钮）
- [x] Role 表单改造为 StandardForm（2 字段 + 系统角色提示）
- [x] Role 详情页保持手写（三标签页含权限管理面板，超出 StandardDetailPage 适用范围）
- [x] PermissionCheckboxGroup 保持独立（无可替代的标准组件）
- [x] 类型检查通过，零错误

## 当前状态

> **做到哪了：** 三个模块（Agents/User/Role）的标准化改造完成
> **卡在哪：** 无
> **下一步：** 提交变更，确认修改汇总
> **决策上下文：**
>
> - RoleDetailPage 保持手写因其三标签页含权限管理面板，改造成本与收益不匹配
> - RoleAssignmentModal 调用 user.assignRole 但该 API 端点实际在 admin 路由上，属预存在缺陷，本次未解决（超出范围）
> - Agents 的温度 Slider 使用 StandardForm `custom` 类型 + `render` 实现

## 变更文件清单

| 文件                                                       | 变更 | 原因                                    |
| ---------------------------------------------------------- | ---- | --------------------------------------- |
| `apps/admin/src/modules/agents/components/AgentForm.tsx`   | 修改 | StandardForm 声明式，11 字段 + 共享常量 |
| `apps/admin/src/modules/agents/components/AgentDetail.tsx` | 新增 | DetailFieldConfig 配置                  |
| `apps/admin/src/modules/agents/components/index.ts`        | 修改 | 新增导出（Detail、常量）                |
| `apps/admin/src/modules/agents/pages/AgentListPage.tsx`    | 修改 | 改为 StandardListPage，添加详情跳转     |
| `apps/admin/src/modules/agents/pages/AgentDetailPage.tsx`  | 新增 | StandardDetailPage                      |
| `apps/admin/src/modules/agents/pages/index.ts`             | 修改 | 修复死导出，新增 AgentDetailPage        |
| `apps/admin/src/modules/agents/index.ts`                   | 修改 | 新增 AgentDetailPage 导出               |
| `apps/admin/src/modules/user/pages/UserListPage.tsx`       | 修改 | 改为 StandardListPage（只读）           |
| `apps/admin/src/modules/user/pages/UserDetailPage.tsx`     | 修改 | 改为 StandardDetailPage                 |
| `apps/admin/src/modules/user/components/UserForm.tsx`      | 修改 | 改为 StandardForm 声明式                |
| `apps/admin/src/modules/user/components/UserDetail.tsx`    | 新增 | DetailFieldConfig 配置                  |
| `apps/admin/src/modules/user/index.ts`                     | 修改 | 新增导出                                |
| `apps/admin/src/modules/role/pages/RoleListPage.tsx`       | 修改 | 改为 StandardListPage                   |
| `apps/admin/src/modules/role/components/RoleForm.tsx`      | 修改 | 改为 StandardForm 声明式                |
| `apps/admin/src/App.tsx`                                   | 修改 | 新增 agents/:id 路由，更新导入          |

## 变更统计

| 指标       | Agents      | User        | Role       | 合计     |
| ---------- | ----------- | ----------- | ---------- | -------- |
| 新增文件   | 2           | 1           | 0          | 3        |
| 修改文件   | 4           | 4           | 2          | 10       |
| 文件总计   | 6           | 5           | 2          | 13       |
| 代码量估算 | 318→~130 行 | 438→~100 行 | 220→~90 行 | -62% avg |

## 备注

- RoleDetailPage 保持手写：三标签页（info/permissions/users）含权限管理面板，StandardDetailPage 的 `tabs` 支持 `render` 模式但不会显著减少代码量
- RoleAssignmentModal 预存在缺陷：调用 `user.assignRole` 但该 API 端点不在 user 路由上（在 admin 路由），该缺陷在本次改造前已存在
- 新增 `AgentDetailPage` 需要在 `App.tsx` 注册路由 `agents/:id`
