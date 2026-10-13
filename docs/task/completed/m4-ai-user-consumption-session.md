# M4 第一批：运行时 AI 用户端消费与会话持久化

- **分支**：`main`
- **创建**：2026-10-13
- **ADR**：[ADR-006](../../adr/006-runtime-ai-user-consumption-session.md)
- **路线图**：[ai-native-roadmap.md](../../product/ai-native-roadmap.md) 第 3 步（E9 前两项）

## 目标

把 AI 从 Admin 内置变成全端能力：用户端（Web）以 User 身份消费 Agent（REST + SSE），带多轮会话持久化。

## 检查清单

### 1. shared 契约层

- [x] `AgentYmlSchema` 加 `audience: 'admin' | 'user' | 'all'`（缺省 admin）
- [x] yml-schemas 单测覆盖 audience 默认值与非法值
- [x] `pnpm --filter @loom/shared build`

### 2. 数据模型

- [x] `schema.prisma` 新增 AgentSession + AgentMessage
- [x] `/db-migrate`（迁移 + Prisma Client + seed）

### 3. API 端（apps/api）

- [x] AgentYamlLoader 透出 audience
- [x] run 端点：user 调 audience:admin → 403；listActive 按身份过滤
- [x] 工具闸门：beforeToolCall 的 RBAC 检查仅对 admin 生效
- [x] 会话端点 4 个：POST/GET list/GET detail/DELETE（仅 user 身份，强制 userId 隔离）
- [x] run 端点扩展 sessionId：归属校验 → user 消息写入 → 历史注入（chat + loop）→ assistant 消息写入 + lastMessageAt/title
- [x] SSE run_start 带可选 sessionId
- [x] controller/runtime 单测（会话归属、audience 拒绝、历史注入）

### 4. Web 端（apps/web）

- [x] `lib/ai-api.ts`：sessions CRUD + runAgentSSE（fetch stream + Bearer）
- [x] `(protected)/ai/chat` 示范页：会话列表 + agent 下拉 + 流式聊天窗口
- [x] 导航入口

### 5. 示范 YML

- [x] simple-chat：`audience: all` + `{{input.message}}`
- [x] todo-analyst：`audience: all`

### 6. 验证

- [x] shared 单测 + api 相关 spec 通过
- [x] `/type-check` 全绿
- [x] 浏览器实测：Web 登录 → 建 agent 选择 → 建会话 → 流式对话 → 刷新后历史恢复 → todo-analyst 工具调用返回用户自己的数据

## 当前状态

✅ 全部完成（2026-10-13）。验证记录：shared 18 测试、api AI 相关 55 测试、三端 tsc 全绿、REST 全链路（建会话→两轮对话记忆→消息持久化→title 生成→admin 403→跨用户 404→message 必填 400→audience 过滤→todo-analyst 工具转发用户数据）、浏览器实测（登录→agent 下拉→会话列表→历史恢复→流式多轮对话→新会话 title 生成）。期间 Docker 引擎卡死一次（约 15 分钟后自愈），恢复后复验通过。

顺带修复（验证时发现）：① web 服务端上游地址与浏览器端基址解耦（`API_UPSTREAM_URL`，后端不在 3000 时 web 认证链路全断的既有缺陷）；② `runAgentStream` 补 401 自动刷新重试（与 apiClient 同模式）；③ E4 遗留的 bookmark DB 残留清理（DROP TABLE + 清 `_prisma_migrations` 两条记录）。

## 变更文件清单

- docs/adr/006-runtime-ai-user-consumption-session.md（新增）
- docs/task/active/m4-ai-user-consumption-session.md（本文档）
- infra/shared/src/ai/yml-schemas.ts（audience 字段）+ spec
- infra/database/prisma/schema.prisma（AgentSession/AgentMessage）+ migrations/20261013110552_agent_session_message
- apps/api/src/core/exceptions/error-codes.ts（ERR_6008/6009）
- apps/api/src/modules/ai/services/agent-session.service.ts（新增）+ spec
- apps/api/src/modules/ai/rest/ai-agents.controller.ts（audience 过滤 + 会话端点 + run 扩展）
- apps/api/src/modules/ai/module.ts（注册）
- apps/api/src/ai/agents/agent-runtime.service.ts（历史注入 + user 跳过工具 RBAC）+ spec
- apps/api/src/test/prisma-mock.ts（agentSession/agentMessage + 数组式 $transaction）
- apps/api/src/ai/definitions/agents/*.yml（audience: all 示范）
- apps/web/src/lib/ai-api.ts（新增）+ api-client.ts（导出 getAccessToken/refreshAccessToken）
- apps/web/src/lib/api-upstream.ts（新增）+ 5 个 auth route + next.config.ts（上游地址解耦）
- apps/web/src/app/(protected)/ai/chat/page.tsx（新增聊天示范页）
- apps/web/src/components/layout/Sidebar.tsx（AI 助手入口）
