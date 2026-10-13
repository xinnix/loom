# Loom 脚手架 ROADMAP

进度台账：**只记阶段状态、关键产物与日期**。任务明细见 [product/backlog.md](product/backlog.md)，功能规格见 [product/prd.md](product/prd.md)。完成后立即回写本表（不靠回忆）。

## 阶段总览

| 阶段 | 主题                            | 状态      | 完成时间 |
| ---- | ------------------------------- | --------- | -------- |
| M1   | 基础设施与核心特性              | ✅ 完成   | 2026-07  |
| M2   | 抽象层与模块标准化              | ✅ 完成   | 2026-09  |
| M3   | 全端 API 生成覆盖与工程化       | ✅ 完成   | 2026-10  |
| M4   | 运行时 AI 演进（AI 原生第一批） | 🔨 进行中 | —        |

## 各阶段详情

### M1 — 基础设施与核心特性 ✅

Monorepo 脚手架骨架 + 核心能力全部就绪：双用户认证、RBAC、微信支付、文件存储、Admin/Web/Miniapp/Landing 多端应用壳、genModule 初版。

### M2 — 抽象层与模块标准化 ✅

- 三大标准组件落地并以 Todo 模块示范（[ADR-003](adr/003-standardized-ui-pattern.md)，2026-07-20）
- 架构治理就位：模块健康检查清单、ADR 机制、依赖/清理规则（2026-07-20）
- 全部业务模块完成标准化改造（[ADR-004](adr/004-module-standardization-push.md)，2026-09）
- 期间产物：Permission Registry 类型安全权限、LLM 抽象层（D6）、Todo 全端示范、createCrudRouter search/filter、抽象层 118 组件用例、上传模块三策略修复

### M3 — 全端 API 生成覆盖与工程化 ✅

生成器覆盖外部端 API 面与 Admin 三件套全量、端到端测试体系、核心包类型安全。范围定界见 PRD D7（Web/miniapp 页面个性化高，不生成，各端手写）。

- E1 测试体系最小版：Playwright E2E 主路径（Admin CRUD / Web 登录→Todo）+ API 集成测试跑真实 PostgreSQL（2026-10-13）
- E2 strict 类型安全：api/admin strict 全绿，tRPC 端到端类型打通（2026-10-13）
- E4 genModule 扩展：REST Controller（userId 隔离 + 信封契约）+ Admin 三件套补全 DetailPage + Web/miniapp API client + `--fields`/`--meta`/`--no-rest` CLI + deleteModule 清理闭环（2026-10-13）
- 期间产物（2026-10）：AI 三层架构（ADR-005，pi 底座：LlmConfig 加密配置 / YML 工具 / YML Agent 编排 + Playground，2026-10-12）

### M4 — 运行时 AI 演进（AI 原生第一批）🔨

方向与顺序见 [ai-native-roadmap.md](product/ai-native-roadmap.md) 第 3/4 步。实施前先补 ADR。

- 第 3 步完成：用户端 REST 消费 + 会话持久化（[ADR-006](adr/006-runtime-ai-user-consumption-session.md)：YML audience 可见性 / AgentSession+AgentMessage 两表 / SSE 零变更 / 历史注入首个节点 / Web 聊天示范页，2026-10-13）
- 待做：第 4 步写操作工具 + human-in-the-loop 审批链（另立 ADR）

## 回写规则

| 事件             | 动作                                                          |
| ---------------- | ------------------------------------------------------------- |
| 功能完成         | 对应阶段补关键产物 + 日期；epic 从 backlog 移入其「已完成」节 |
| 阶段全部完成     | 状态改 ✅ 并写完成时间；下一阶段从 ⬜ 改 🔨                   |
| 实现与规划有出入 | 以实现为准，同时检查 backlog/PRD 是否需要联动修订             |
