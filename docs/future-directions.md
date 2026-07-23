# Loom 脚手架 — 下一步改造方向

> 本文档整理本次改造周期未覆盖的优化方向，作为后续迭代的参考。

---

## 目录

1. [模块标准化推广](#1-模块标准化推广)
2. [Web 端全栈覆盖](#2-web-端全栈覆盖)
3. [小程序端全栈覆盖](#3-小程序端全栈覆盖)
4. [测试进阶：E2E 和集成测试](#4-测试进阶e2e-和集成测试)
5. [开发者体验扩展](#5-开发者体验扩展)
6. [CI/CD 进阶](#6-cicd-进阶)
7. [TypeScript 严格模式](#7-typescript-严格模式)
8. [架构治理](#8-架构治理)
9. [性能与安全](#9-性能与安全)
10. [文档完善](#10-文档完善)

---

## 1. 模块标准化推广

### 现状

StandardListPage、StandardForm、StandardDetailPage 三件套已就绪，Todo 模块已完成示范改造。但其余 6 个业务模块仍使用手写模式。

### 待改造模块

| 模块       | 当前模式                                    | 工作量                   | 优先级 |
| ---------- | ------------------------------------------- | ------------------------ | ------ |
| **Agents** | 手写 ListPage + 手写 Form                   | 中                       | P1     |
| **User**   | 手写 DetailPage                             | 低                       | P2     |
| **Role**   | 手写 DetailPage + 手写 Form                 | 中                       | P2     |
| **Admin**  | 手写 ListPage + 手写 DetailPage + 手写 Form | 高（含权限管理复杂逻辑） | P3     |
| **Wecom**  | 手写 ListPage + 手写 Form                   | 中                       | P3     |

### 风险与权衡

- Agents/User/Role 的表单逻辑相对简单，改造成本低
- Admin/Role 涉及权限关联，可能超出 StandardForm 的 select + options 范围，需要 checkboxes 或 TreeSelect 扩展

---

## 2. Web 端全栈覆盖

### 现状

Todo 是 Web 端唯一完整的业务模块。Dashboard、Profile 是骨架。

### 待做

- **更多业务模块**：在 Admin 端有对应模块时，同步生成 Web 端 REST 页面
- **标准化页面模式**：目前 Web 端每个页面是独立手写的 Tailwind 组件，没有类似 StandardListPage 的抽象层
- **新增 `/create-web-module` 技能**：从 tRPC Router 自动推导 Web 端 REST API + 页面（原计划中的缺失技能）

### 建议

Web 端采用 Ant Design 还是保持纯 Tailwind 是一个架构决策。当前 Web 端全部手写 Tailwind（无组件库），页面模式很相似但未抽象。如果业务模块数量增长到 5+，建议创建 Web 端的列表/表单/详情标准组件（Tailwind 版）。

---

## 3. 小程序端全栈覆盖

### 现状

`apps/miniapp/` 只有登录 + 个人中心，无业务模块。

### 待做

- 创建 miniapp 端 Todo 模块页面（API 客户端已由 genModule 生成）
- 扩展 `/genModule` 输出 miniapp 页面（当前仅生成 API client）
- 新增 `/create-miniapp-module` 技能

---

## 4. 测试进阶：E2E 和集成测试

### 现状

抽象层组件测试已经覆盖（118 用例），但缺少端到端集成验证。

### 待做

| 工作项           | 说明                                                                                 | 优先级 |
| ---------------- | ------------------------------------------------------------------------------------ | ------ |
| Playwright E2E   | Playwright 已安装，可以增加：Admin 页面 CRUD 路径、Web 登录 → 创建 Todo → 验证列表   | P1     |
| API 集成测试     | 使用测试 PostgreSQL 数据库运行真实 Prisma 操作，测试 TodoController REST 端点        | P2     |
| 生成模块测试增强 | genModule 生成的 `router.spec.ts` 目前只有基础 CRUD 测试，可增加权限、搜索、筛选测试 | P2     |
| 组件测试增强     | StandardListPage search/filter 交互、StandardForm resource-based DynamicSelect       | P3     |

---

## 5. 开发者体验扩展

### 缺失技能（原计划 4b）

| 技能             | 说明                                                         | 优先级 |
| ---------------- | ------------------------------------------------------------ | ------ |
| `web-api`        | 创建 Web 端 REST API 端点（apps/web/ 的 Next.js API Routes） | P2     |
| `web-page`       | 创建 Web 端用户页面（apps/web/ 的 Next.js App Router 页面）  | P2     |
| `miniapp-api`    | 创建小程序端 API 调用和页面                                  | P3     |
| `staging-deploy` | 部署到预发布环境                                             | P3     |

### 新开发者上手体验（原计划 4c）

- init-project 末尾添加环境验证步骤
- 首次 `pnpm dev:all` 验证 4 个服务启动正常
- 可从 `.env.example` 自动复制生成 `.env`

### 钩子增强

- PreToolUse 钩子：`pnpm install` 前检查 lockfile 一致性（已有想法未实现）
- PostToolUse 钩子：编辑后自动 ESLint 检查（可能过于嘈杂，需评估）

---

## 6. CI/CD 进阶

### 现状

已添加 migration 一致性检查 + Docker 构建缓存。

### 待做

| 工作项            | 说明                                                                                        | 优先级                     |
| ----------------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| 预览部署          | PR 触发临时预览环境（需要 staging 服务器）                                                  | P2                         |
| 性能预算          | CI 中标记 Docker image 大小、构建时间回退                                                   | P3                         |
| 数据库集成测试    | CI 中启动 PostgreSQL 服务运行集成测试                                                       | P2                         |
| Docker 基础层共享 | API/Admin/Web/Landing 的 Dockerfile 使用同一 base layer                                     | P3                         |
| 双阶段 deploy     | 生产部署时先 `prisma migrate deploy` 再重启（当前在 entrypoint 中迁移，可能导致多副本竞态） | P1（仅在多副本部署时需要） |

---

## 7. TypeScript 严格模式

### 现状

| 包             | strict   | noImplicitAny | strictNullChecks |
| -------------- | -------- | ------------- | ---------------- |
| `@loom/shared` | ✅ true  | ✅            | ✅               |
| `apps/api`     | ❌ false | ❌ false      | ❌ false         |
| `apps/admin`   | ❌ false | ❌ false      | ❌ false         |
| `apps/web`     | ✅ true  | —             | —                |

### 建议

逐步启用严格模式（先 API、再 Admin）。

**风险**：`apps/api/src/common/base.service.ts` 和 `apps/api/src/trpc/trpc.helper.ts` 大量使用 `as any`，打开 strict 需要先修复这些核心抽象层。

**工作量预估**：API 包 1-2 天，Admin 包 2-3 天。

---

## 8. 架构治理

### 待添加

| 文档/规则        | 说明                                                                        | 优先级 | 状态 |
| ---------------- | --------------------------------------------------------------------------- | ------ | ---- |
| 模块健康检查清单 | 新模块应满足的最小标准（有 Service、Router、Admin 页面、StandardForm 用法） | P1     | ✅   |
| ADR 目录         | 记录关键架构决策（如"为什么选 tRPC + REST 双协议""为什么选 Refine"）        | P2     | ✅   |
| 依赖治理规则     | 何时允许新增依赖（先查有无可用替代、审批流程）                              | P2     | ✅   |
| 废弃模块清理规则 | 何时可以安全删除未使用的模块                                                | P3     | ✅   |

这些规则写入 `CLAUDE.md` 后，Agent 可在开发时自动遵守。

---

## 9. 性能与安全

### 性能

| 项目              | 说明                                         | 优先级 |
| ----------------- | -------------------------------------------- | ------ |
| API 构建工具      | 当前使用 `tsc` 编译，可考虑 SWC/esbuild 提速 | P3     |
| Admin bundle 分析 | 配置 `rollup-plugin-visualizer` 分析包体积   | P3     |

### 安全

| 项目                | 说明                                                              | 优先级 |
| ------------------- | ----------------------------------------------------------------- | ------ |
| 数据库密钥加密      | Agent 模型存储 `apiKey`、WecomConfig 存储 `secret` 为明文，应加密 | P1     |
| Docker 非 root 用户 | 所有 Dockerfile 以 root 运行，应创建非 root 用户                  | P2     |
| 速率限制持久化      | 当前 `trpc-rate-limit.middleware.ts` 使用内存 Map，多实例会丢失   | P2     |
| CSRF 保护           | Next.js Web 端缺少 CSRF 防护                                      | P3     |

---

## 10. 文档完善

### 缺失文档（原计划方向八）

| 文档         | 优先级 | 说明                                |
| ------------ | ------ | ----------------------------------- |
| 模块开发指南 | P1     | 每个模块的 README，记录特殊业务逻辑 |
| API 接口文档 | P2     | REST 端点和 tRPC 路由清单           |
| 错误码手册   | P2     | 各模块自定义错误码描述              |
| 部署 Runbook | P3     | 故障排查、回滚步骤、监控指标        |
| 本改造总结   | ✅     | 已在 `docs/refactoring-summary.md`  |

---

## 优先级建议

| 优先级 | 方向                                 | 预估工作量   | 判断理由                                              |
| ------ | ------------------------------------ | ------------ | ----------------------------------------------------- |
| **P1** | 模块标准化推广（Agents/User/Role）   | 2-3 天       | 已有标准组件，改造成本低，收益直接（代码量减少 50%+） |
| **P1** | 架构治理（健康检查清单 + CLAUDE.md） | 0.5 天       | 写入后 Agent 自动遵守，长期省心                       |
| **P1** | 数据库密钥加密                       | 1 天         | 安全隐患                                              |
| **P2** | Playwright E2E 测试                  | 2-3 天       | 集成验证能力缺失                                      |
| **P2** | TypeScript 严格模式（API）           | 1-2 天       | 类型安全提升                                          |
| **P2** | 缺失技能（web-api/web-page）         | 1 天/个      | 按需创建                                              |
| **P3** | 小程序端覆盖                         | 3-5 天       | Web 端需求更优先                                      |
| **P3** | CI/CD 预览部署                       | 需服务器资源 | 依赖基础设施                                          |
