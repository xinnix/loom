# E4 + E2 收尾 M3

## 概述

M3 收尾双项。完成后 M3 关闭、进入 M4（运行时 AI 演进）。

- **E2 strict 类型安全** ✅（2026-10-13 完成）：API 与 Admin 开启 TS strict；`AppRouter` 真实类型打通。
- **E4 genModule 生成扩展**（2026-10-13 用户重定界，PRD D7）：生成器只生成**后端 API（REST Controller）+ Admin 三件套（StandardListPage/StandardForm/StandardDetailPage）+ Web/miniapp API client**；Web/miniapp 页面个性化程度高，不生成页面（各端手写）。

## 检查清单

### E2 strict 类型安全 ✅

- [x] 侦察：api 开 strict 仅 2 错（@types/pg 双版本冲突，卸载即愈）；admin 真实 24 错（root references 模式此前不真查）
- [x] api tsconfig 开启 strict 全绿（顺手开 declaration 供类型桥使用）
- [x] admin tsconfig（app/node）开启 strict，修复 24 处类型错误（refine v5 返回结构、Record<boolean> 索引、闭包收窄丢失、AntD 规则类型等）
- [x] `AppRouter = unknown` → 经 workspace 包（@loom/api devDep + dist d.ts）引用真实类型，tRPC 端到端类型打通
- [x] scripts/type-check.sh 的 admin 检查改 `tsc -b`（原 `tsc --noEmit` 对 references 不真查）

### E4 genModule 生成扩展（重定界后）

- [x] Step 1：REST Controller 生成（母本 todo.controller.ts 参数化；`--no-rest` 跳过；Prisma 模板补 userId 隔离字段 + createdById/updatedById 审计字段）
- [x] Step 2：Admin DetailPage 生成补全（Detail 字段配置 + statusConfig + App.tsx detail 路由 + 双 barrel；枚举字典统一 buildEnumDicts）
- [x] Step 3：Web REST client 生成（`apps/web/src/lib/api/<camel>.ts`：wire 类型 + 枚举字典 + xxxApi + buildQuery）；CLI 新增 `--fields`/`--meta`/`--no-rest`；dry-run 增强
- [x] Step 4：deleteModule 配套扩展（Prisma model、app.module、权限注册、miniapp 三件、web client、detail 路由；生成→删除回归闭环，git 零残留）
- [x] Step 5：文档编排（SKILL.md 产物清单/编排流程/Checklist、rest-layer.md 重写对齐实际、frontend-templates.md 过期声明、PRD F3+D7、ROADMAP M3 措辞、backlog E4）
- [x] Step 6：bookmark 模块端到端验证（type-check 三端全绿、tRPC spec 3/3、REST curl 冒烟全过、Playwright E2E 登录→新建→列表→详情→返回→删除全通过）

### 实施中顺带修复的预存缺陷

- `updateAppRouter`/`updateAppModule` 锚点漂移（mergeRouters→router 形态、双引号→单引号），此前生成在今天代码库上必失败
- `inferFieldConfig` 审计误判：与模式同名的普通字段（price/url/dueDate）被当审计字段从表单/表格/详情吞掉
- App.tsx/AdminLayout 插入吃缩进、菜单项落错层级（插到 menuConfig 顶层而非 children）
- **TransformInterceptor 契约**：列表分页字段须顶层扁平返回（母本 todo.controller 的 meta 嵌套会被丢弃——todo 参考实现自身的隐性 bug，未动待修）
- currency/percent 列渲染 null 不安全（`!== undefined` 判空，Prisma 返回 null 即崩）
- 生成 ListPage 的 renderRowActions 覆盖默认编辑/删除（改用 helpers 复用 + Popconfirm）
- 生成的 spec：prisma-mock 路径深度、ctx 缺 requestId、权限缺失、create 入参不满足必填字段
- router spec 模板 create 数据按必填字段生成（含枚举首值）

### 出界记录（2026-10-13 用户确认）

- Web 页面 / miniapp 页面生成——各端手写
- targets 多端选择机制——简化为 `--no-rest` 开关
- miniapp 侧改动——现有 client 生成已正确（T=payload）
- REST 层 Service 化 / Zod 校验 / Swagger——留 E6

## 当前状态

✅ E4 全部完成（2026-10-13）。待办：docker 引擎卡死期间 bookmark 的 DB 残留未清（`Bookmark` 表 + `_prisma_migrations` 两条记录；迁移文件已删）——docker 恢复后执行 `DROP TABLE IF EXISTS "Bookmark";` + 清 `_prisma_migrations` 中 bookmark 记录，否则下次 `migrate dev` 会报 drift。

## 变更文件清单

（E2 部分）apps/api/tsconfig.json + package.json（strict/declaration/types 入口）、apps/admin/tsconfig.*.json + package.json（strict + @loom/api devDep）、src/types/api.ts（真实 AppRouter）、App.tsx / AdminDetailPage / RoleDetailPage / UserDetail / UserListPage / StandardForm×2 / StandardListPage / trpcClient / dataProvider（24 处类型修复）、scripts/type-check.sh、pnpm-lock.yaml

（E4 部分）.claude/skills/genModule/scripts/generate-module.ts（targets 简化为 --no-rest、REST controller/DetailPage/Web client 三生成器、buildEnumDicts、--fields/--meta CLI、dry-run/checkModuleExists 增强、锚点修复、null 安全渲染、行操作补全）、.claude/skills/deleteModule/delete-module.ts（7 处清理缺口 + 移除正则精确化）、.claude/skills/genModule/SKILL.md（产物清单/编排流程/Checklist/CLI）、.claude/skills/genModule/references/rest-layer.md（重写）、references/frontend-templates.md（过期声明）、docs/product/prd.md（F3+D7）、docs/ROADMAP.md（M3 措辞）、docs/product/backlog.md（E4 条目）
