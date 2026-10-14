# 更新日志（Changelog）

本项目的版本变更日志（ADR-010：文件真理源，管理端「更新日志」页只读展示）。

**登记规则**：每次改动必须在此登记——含用户可见变化的改动递增版本号（新能力 → 次版本号，修复 → 修订号），纯内部调整并入当前版本的「变更」组；条目按类型分组（新增/变更/修复/移除/安全），新版本在最上方。写法约束见 `docs/adr/010-changelog.md`。

## [0.7.0] - 2026-10-14

### 新增

- 变更日志机制（ADR-010）：根目录 `CHANGELOG.md` 文件真理源 + API 解析服务 + 管理端「更新日志」展示页（`/changelog`，类型筛选与搜索）；本条目即首次实践
- 每次改动登记 changelog 写入 AGENTS/CLAUDE 开发规范（开发后必做清单）

### 修复

- 管理端四个新页面的类型错误（触发器表单字段类型、用量看板 Statistic 属性、参数页视图类型），`pnpm type-check` 三端全绿

## [0.6.0] - 2026-10-14

### 新增

- LLM 调用观测层（ADR-007）：`LlmCallLog` 请求级用量流水（双缓冲写入、背压丢弃、30 天保留）+ chat/loop 双路径埋点（旁听 pi `result()`，零行为改变）+ 管理端「AI 用量」看板（`/ai/usage`，四维透视与成本归因）+ `LlmConfig` 单价字段与成本三链归因
- 平台参数中心（ADR-008）：`SettingsService` 三层读取链（数据库 → 环境变量 → 派生）+ 最小字段目录 + 管理端「平台参数」配置页（`/settings`，脱敏展示与来源标注）+ 配置注入铁律文档
- Agent 定时触发（ADR-009）：泛化 cron → run(agentSlug) 触发器、CAS 原子抢占调度（多实例幂等）、YML `triggers.cron` 运行时生效（双源：YML 管存在性、DB 管启停）、灰度门控键、管理端触发器页（`/ai/agent-triggers`）
- 管理端 StandardListPage 深链能力（`autoOpenEditParam`：URL 参数直达编辑弹窗）与前端 PermissionGuard super_admin 直通

### 变更

- LLM 静态兜底链与用量看板价格兜底切换为平台参数中心读取（数据库优先于环境变量）
- 吸收 weSale 文档方法论：`docs/README.md` 增补优先级约定与反模式清单；backlog 引入「拍板 + 触发条件」记录惯例

## [0.5.0] - 2026-10-13

### 新增

- 用户端 AI 会话（ADR-006）：用户身份 REST 触发 Agent（audience 可见性控制）、AgentSession/AgentMessage 持久化、会话历史注入、Web 聊天示范页
- 端到端测试体系最小版（E1）：Playwright 主路径（Admin CRUD / Web 登录→Todo）+ API 集成测试接入真实 PostgreSQL
- genModule 全端生成扩展（E4）：REST Controller（userId 隔离）、Admin 三件套补全、Web/小程序 API client、`--fields`/`--meta`/`--no-rest` CLI

### 变更

- API 与 Admin 开启 TS strict，端到端类型打通（E2）
- M3 关闭、M4（运行时 AI 演进）开启

## [0.4.0] - 2026-10-12

### 新增

- 框架原生 AI 三层架构（ADR-005）：pi 底座 LLM 配置层（AES-256-GCM 加密落库）+ YML 声明式工具层 + YML Agent 编排运行时（chat/loop 节点、token 预算熔断、AgentRun 审计）+ 管理端模型配置 / Agent 详情与 Playground / 工具页

## [0.3.0] - 2026-09-27

### 变更

- Landing 深色版重设计整合：替换浅色页面与字体体系，介绍更新为多 Agent 定位

## [0.2.0] - 2026-09-24

### 新增

- 多 Agent 工具支持：技能多端分发（Codex/OpenCode/ZCode，`sync-agents.sh` 镜像 + 漂移校验）

### 变更

- 文档体系按分层框架重建（vision/prd/mvp/backlog/ROADMAP 单向引用），修复全仓幽灵引用
- CI 恢复全绿：消除 miniapp lint/format 规则冲突，全仓 TypeScript 统一 5.9.3

### 修复

- 上传模块 local 模式缺陷与 OSS 凭证/URL 问题；上传组件按存储配置自动选择直传或服务端中转

## [0.1.0] - 2026-07-13

### 新增

- 脚手架基座：pnpm monorepo、双用户认证体系（Admin tRPC + User REST/微信登录）、RBAC 权限（类型安全 registry）、Todo 参考模块全端覆盖、三端标准组件（StandardListPage/StandardForm/StandardDetailPage）
- 持久化任务追踪系统与架构治理（ADR 目录、模块健康检查清单、依赖治理）
- 模块标准化推广与 genModule 代码生成（ADR-004）
