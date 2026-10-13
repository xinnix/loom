# ADR-005: 框架原生 AI 三层架构（LLM / 工具 / Agent 编排）

- **日期**：2026-10-12
- **状态**：✅ 已采纳

## 背景

PRD 决策 D6（2026-08）以通用 LLM 抽象层替代 Dify 平台集成后，框架仅剩"带 LLM 参数的配置实体"（`modules/agents` + 极简 `src/llm/`，不支持 function calling）。用户需要一个框架原生的 AI 能力板块：模型配置、可编排的 agent 工作流（YML 声明节点/工具/触发），而不是外挂 Dify 式平台——外挂平台与"代码即交付"的脚手架定位冲突（配置存 DB 导致版本兼容问题与 Git 晋升难题，正是 Dify 社区自身的痛点）。

业界对标结论：三层分解与 TS 生态主流一致（Vercel AI SDK 的 model 层 → Mastra 的 agents/tools/workflows → LangGraph 的图编排）。完整集成 Mastra 被排除：其自带存储体系与 R1 SSOT 红线冲突、code-first 无法满足 YML 编排诉求、NestJS adapter 存在 catch-all 路由与双 auth 摩擦。LLM 底座选 **pi（pi-mono，@earendil-works/pi-ai + pi-agent-core）**而非 Vercel AI SDK：极简零依赖契合"简单优先"、`beforeToolCall` hook 架构贴合权限闸门（授权先于工具执行）、事件粒度最细；代价（步数限制/结构化输出/重试需自补）已纳入设计。

## 决策

### D1 YML 文件为编排与工具定义的唯一真理源

`apps/api/src/ai/definitions/`（agents/_.yml + tools/_.yml）随 git 版本控制，启动时经 `infra/shared` 的 Zod schema 校验（R1：shared 是验证真理源），dev 环境热加载（失败保留旧版本）。DB `Agent` 行瘦身为**部署期绑定记录**：`slug`（关联 YML）、`llmConfigId`/`tools`（Agent 级默认值）、`isActive`（kill switch）、`sort`，展示字段（name/description/icon）由 loader 从 YML 同步缓存。

**YML 演进原则（必须遵守）**：复杂逻辑进工具或代码，永远不进 YML。模板变量仅支持 `{{input.*}}` 与 `{{nodes.<id>.output}}` 两种点路径、无控制流、节点仅 chat/loop 两种、workflow 严格顺序执行（无 DAG/分支/并行）。防止声明式配置长成 GitHub Actions 式的自创编程语言。

### D2 apiKey AES-256-GCM 加密（关闭 backlog E3）

`llm_configs.apiKeyEnc` 存 `v1:` 前缀密文（iv|authTag|ciphertext），密钥 env `AI_ENCRYPTION_KEY`（32B）；`apiKeyMask` 供展示；明文仅在 pi provider 发起请求的瞬间存在；日志只记 configKey 与模型名。WecomConfig.secret 明文为遗留项（复用 LlmCryptoService 改造，后续处理）。

### D3 模型配置解析优先级：node.llm > Agent.llmConfigId > isDefault > env

节点级（YML）最具体、部署级（DB）次之、全局默认兜底、env 静态配置最后。落实 PRD F6：切换 provider 只改配置不改代码。

### D4 工具执行 = 转发触发者原始 JWT 到本机回环 REST

工具即内部接口的声明式映射（YML：name/description/参数 JSON Schema 子集/method/path/permission/paramPlacement/timeoutMs）。执行链：pi AJV 参数校验（失败回给模型自纠）→ YML `permission` 第二道闸门（`beforeToolCall` hook，授权先于执行）→ 回环 fetch（`http://127.0.0.1:$PORT` 硬编码、path 仅来自启动校验过的 YML、method 白名单 GET/POST、`redirect: 'error'`、结果 50KB 截断）。内部端点既有 `JwtAuthGuard` 零改动生效，权限跟随人走——即 OWASP AI Agent Security Cheat Sheet 的 Tool Authorization Middleware 模式。

### D5 权限收敛（D8）与 API 边界（R4）

`agent: {read, run}`（CRUD 权限点删除——Admin 只读）；新增 `llmConfig: {create,read,update,delete}`、`aiTool: {read}`、`menu: {llmConfigs, aiTools}`。旧 `POST /agents/:id/chat` 端点删除（无调用方）；新端点 `POST /api/ai/agents/:slug/run`（SSE，admin 需 `agent:run`，user 类型仅认证）+ `GET /api/ai/agents`。Admin 管理 tRPC 三命名空间：`llmConfigs`（标准 CRUD 工厂 + testConnection）、`agents`（只读 + runs + getDefinition）、`aiTools`（ToolRegistry 内存数据源，不走 CRUD 工厂的合理例外）。

### D6 统一 SSE 事件协议

`run_start / node_start / content / tool_call / tool_result / node_end / run_end / error`。chat 节点流式（text_delta 直通），loop 节点经 pi-agent-core agentLoop 跑工具循环。

### D7 防失控三闸门

① loop 节点 `maxIterations` 必填（`finishTurn` hook 强制）；② run 级 token 预算（默认 100K，YML `budgetTokens` 可覆盖，超限熔断标 truncated）；③ 客户端断连 → AbortSignal 全链路中止 → run 标 failed。

## 威胁模型声明（OWASP 对标）

**间接 prompt injection**：工具结果回填 loop 上下文 = 不可信内容进入指令通道（OWASP LLM01/5.12）。缓解成立：工具结果仅来自启动校验过的白名单端点、参数前置校验、且 **blast radius 有界** = 该 agent YML 工具并集以触发者身份执行。**MVP 只接只读工具**（todo list/count 为只读查询）；未来接入写操作工具时必须先行实现 human-in-the-loop 审批（OWASP 6.11，AI SDK/pi 的 tool approval 语义可复用）。授权不依赖模型判断（"Rely solely on model output for authorization decisions" 是 OWASP 明确的 Don't）。

## MVP 边界（明确不做）

RAG/知识库/向量库、Dify 式可视化画布、多分支/条件/并行节点、cron/队列触发（YML triggers.cron 字段校验通过但运行时忽略并 warn）、多轮会话持久化（每次 run 独立，AgentRun 即最小 observability：nodeTrace/usage/durationMs）、evals、durable execution（run 活在 HTTP SSE 生命周期内，属短任务运行时；AgentRun 表为将来断点续跑留数据基础）。

## 权衡

### 优点

- 编排随 git 版本控制，dev→staging→prod 晋升 = 代码部署，无 DSL 导入导出
- 三层职责清晰：换模型改 DB 配置（F6）、加工具写 YML、改编排写 YML
- 安全模型完整（最小工具集/权限双闸门/参数校验/SSRF 防护/预算熔断/审计）
- pi 底座极简零依赖；`LlmService` 门面隔离底层，切换成本限于 `ai/llm/` 目录

### 缺点

- pi 维护主体巴士因子低（badlogic + mitsuhiko 等，活跃但小团队）；ESM-only 需动态 import 适配 CJS
- 无可视化编排，非开发者无法维护 YML（脚手架定位下可接受）
- 同进程同步执行，长任务会占住 HTTP 连接（队列化列为演进方向）
- `moduleResolution: node` 下 pi 子路径导入需 ambient d.ts 补类型（`src/types/pi-ai-subpaths.d.ts`，升级 tsconfig 后可删）

## 实施要点

- 代码组织：`apps/api/src/ai/`（框架级能力，R6：非业务模块）三层子目录 `llm/ tools/ agents/` + `definitions/`；`apps/api/src/modules/ai/`（Admin 管理面 + REST 触发端点）
- 数据模型：`llm_configs` / `agent_runs` 新增，`agents` 瘦身重建（迁移 `20261012144857_ai_three_layer`，破坏性，脚手架无生产数据）
- Admin UI：模型配置（标准 CRUD + 连通性测试）、Agent 编排（只读 + YML 视图 + 运行历史）、Playground（SSE 节点时间线）、工具列表（只读）
- 测试：crypto 14 例、工具层 12 例（stub http server）、runtime 6 例（pi faux provider 脚本化全链路）、router spec 2 例（框架首个 router spec）

## 后续考虑

- cron/队列触发（bull 依赖已备）；durable execution（断点续跑）
- 写操作工具 + human-in-the-loop 审批链
- WecomConfig.secret 等其他明文密钥复用 LlmCryptoService 加密
- 结构化输出的 schema 约束声明（当前 outputFormat: json 仅校验合法性）
- pi 命名空间迁移（@mariozechner → @earendil-works）完成后的依赖收口
