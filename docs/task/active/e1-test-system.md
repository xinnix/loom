# E1 测试体系（最小版）

## 概述

[ai-native-roadmap.md](../../product/ai-native-roadmap.md) 推进顺序第 1 步。目标：把「真实进程 + 真实浏览器 + 真实数据库」的验证闭环立起来，兜住 AI 生成代码的质量。背景教训见 roadmap「关键教训」节。

## 检查清单

### Playwright E2E

- [x] `apps/e2e` 包：Playwright 依赖 + config（admin 5173 / web 3002 两个 project，按文件名分 project）
- [x] Admin 主路径：登录 → LlmConfig 新建 → 编辑 → 删除（Admin 端标准 CRUD 语义的权威资源）
- [x] Admin Todo 只读语义：列表可见且无创建入口（Todo 是用户端数据，REST 注入 userId）
- [x] Web 主路径：登录 → 创建 Todo → 列表可见
- [ ] CI 可跑（先本地 `start-all` 前提下跑通，CI 接入归 E5）

运行方式：`start-all` + seed 后，`pnpm --filter @loom/e2e test`。

### API 集成测试（真实 PostgreSQL）

- [ ] 测试库 `loom_test` 创建 + migrate deploy 流程
- [ ] vitest 集成测试配置（与现有 unit 测试隔离，走真实 Prisma）
- [ ] 用例：Todo CRUD 真实落库
- [ ] 用例：数据隔离（User 只能查到自己的数据，R5）

> 状态：E2E 部分完成（2026-10-13）；集成测试部分待下个任务段。

## 实施中发现并修复的真 bug（E2E 首跑即抓到 4 个）

1. **Web 端 JWT 签发/验证 secret 不一致**（`apps/api/src/modules/auth/module.ts`）：JwtModule secret 在装饰器求值时读取（早于 ConfigModule 加载 .env）拿到 fallback，JwtStrategy 在 DI 时读到 env 值——REST 端（Web/小程序用户）的 JWT 从未工作过。改为 registerAsync + ConfigService 运行时求值。
2. **Web 端业务请求全部无法携带鉴权**（`apps/web/src/middleware.ts`）：token 是 httpOnly cookie，客户端 `document.cookie` 永远读不到 → apiClient 的 Authorization 永远为空。middleware 对 `/api/*` 注入 Bearer header（cookie → Authorization），并新增 `/api/auth/refresh`、`/api/auth/me` 服务端代理路由。
3. **Admin 端 Todo「新建」是死按钮**（`apps/admin/src/modules/todo/pages/TodoListPage.tsx`）：Todo.userId 必填且只能由 REST 注入（R5），Admin 表单/Schema/工厂均无 userId 通路，创建必然 500。收敛为 hideCreateButton（查看/编辑/删除保留）。
4. **seed 缺 5 个权限行**（`infra/database/prisma/seed.ts`）：todo 四权 + admin:manage_roles 从未入库，superadmin 的 Todo 操作按钮被 PermissionGuard 全隐藏。

另修复 E2E 自身：AntD 两字按钮自动插空格（「确 定」），选择器需 `/确\s*定/`。

## 变更文件清单

- `apps/e2e/`（新包）：package.json、playwright.config.ts、tests/admin-crud.spec.ts、tests/web-todo.spec.ts
- `apps/api/src/modules/auth/module.ts`：JwtModule registerAsync
- `apps/web/src/middleware.ts`：/api/* 注入 Authorization
- `apps/web/src/app/api/auth/me/route.ts`（新）、`refresh/route.ts`（新）
- `apps/web/src/lib/auth.ts`：getCurrentUser 改走代理
- `apps/admin/src/modules/todo/pages/TodoListPage.tsx`：hideCreateButton
- `infra/database/prisma/seed.ts`：补 todo 四权 + admin:manage_roles
- `docs/product/ai-native-roadmap.md`（新）、`docs/product/backlog.md`（E9/E10）、`docs/ROADMAP.md`（M4 规划）
