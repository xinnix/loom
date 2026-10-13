# AI 三层架构（LLM / 工具 / Agent 编排）

## 概述

框架原生 AI 能力三层：LLM 层（pi 底座 + LlmConfig 加密配置）、工具层（YML 声明 REST 映射）、Agent 编排层（YML 工作流：chat/loop 节点）。替代 Dify 集成（承接 PRD D6）。计划全文：`~/.claude/plans/dify-ai-vectorized-dove.md`

## 关键决策

- D1 Agent 表瘦身为部署期绑定（YML 真理源，DB 只留 slug/llmConfigId/tools/isActive/sort + 展示缓存）
- D2 apiKey AES-256-GCM（AI_ENCRYPTION_KEY，v1: 前缀）→ 关闭 E3
- D3 模型解析优先级 node.llm > Agent.llmConfigId > isDefault
- D4 工具转发触发者 JWT 回环 REST + YML permission 第二道闸门（beforeToolCall）
- D7 旧 /agents/:id/chat 端点删除；D8 权限收敛 agent:{read,run} + llmConfig 四权 + aiTool:read
- LLM 底座：pi（@earendil-works/pi-ai + pi-agent-core 1.1.0）

## 检查清单

### Phase 0 契约层 ✅

- [x] infra/shared/src/ai/yml-schemas.ts（AgentYml/ToolFileYml + refine 交叉检查）+ yml-schemas.spec.ts
- [x] permissions registry：agent {read,run}、llmConfig 四权、aiTool:read、menu.llmConfigs/aiTools
- [x] seed.ts 同步权限
- [x] pnpm --filter @loom/shared build + vitest 过

### Phase 1 Schema 迁移 ✅

- [x] schema.prisma：LlmConfig/AgentRun 新增、Agent 瘦身重建（含 Admin 反向关系）
- [x] /db-migrate 迁移落库
- [x] 错误码：AI_YAML_INVALID/AI_CONFIG_NOT_FOUND/AI_TOOL_NOT_FOUND/AI_TOOL_EXEC_FAILED/AI_AGENT_NOT_FOUND/AI_AGENT_DISABLED，删 AGENT_SLUG_EXISTS

### Phase 2 LLM 层 ✅

- [x] 安装 @earendil-works/pi-ai + pi-agent-core + yaml
- [x] src/ai/llm/：pi-model.factory / llm-config.service（D3）/ llm-crypto / llm.service 门面（重试薄层）
- [x] crypto.spec + llm-config.service.spec
- [x] 验证：真实 key 手工 chatWith、日志无明文 key、AI_ENCRYPTION_KEY 缺失启动报错

### Phase 3 工具层 ✅

- [x] src/ai/tools/：tool.registry / tool.executor（回环 fetch + JWT 转发 + 50KB 截断）/ tool.schema-validator / interfaces
- [x] spec：转发头/query body/401 透传/截断/重名失败

### Phase 4 Agent 运行时 + API ✅

- [x] src/ai/agents/：agent-yaml.loader（upsert + dev 热加载）/ prompt-template / agent-runtime（chat stream + loop agentLoop + beforeToolCall 权限 + shouldStopAfterTurn + token 预算）/ agent-run.service
- [x] definitions/：simple-chat.yml、todo-analyst.yml、todo-tools.yml
- [x] modules/ai/：三 tRPC router + REST controller（SSE run 端点）+ services
- [x] app.module/app.router 接线；删 src/modules/agents/ 与 src/llm/
- [x] agents.router.spec.ts（首个 router spec）
- [x] /validate 过；curl SSE 事件序列；断连 failed；旧端点 404

### Phase 5 Admin UI ✅

- [x] apps/admin/src/modules/ai/：LlmConfigListPage/Form、AgentListPage 只读、AgentDetailPage + YamlViewer、AgentPlaygroundPage（ssePost）、ToolListPage
- [x] App.tsx resources/Route、AdminLayout menuConfig、barrel
- [x] 手工全流程验证

### Phase 6 文档收尾 ✅

- [x] docs/adr/005-native-ai-three-layer.md（D1-D8 + 威胁模型 + YML 演进原则 + MVP 边界）
- [x] ops env 文档补 LLM_* + AI_ENCRYPTION_KEY + PORT
- [x] 根/api/admin CLAUDE.md 补 ai 说明
- [x] /validate 全绿 + /analyze

## 当前状态

✅ 全部完成（2026-10-12）。验证：api 102 测试全过、shared 38 全过、api/admin/shared 类型零错误、admin vite 构建过、API 冒烟启动（2 工具 + 2 Agent 加载、DB upsert、旧端点 404、新端点 401）。

## 额外修复（实施中发现）

- @loom/shared 构建输出 esnext → commonjs（Node 22.21 ESM 语法检测下的既有回归，阻断启动）
- pi 包 ESM-only：buildPiModel/agentLoop 经动态 import() 加载；子路径类型由 src/types/pi-ai-subpaths.d.ts 补充
- nest-cli.json assets 补 **/*.yml（definitions 需复制进 dist）
- prisma-mock 补 llmConfig/agentRun 模型

## 变更文件清单

**新增（core）：**

- `infra/shared/src/ai/yml-schemas.ts`（+ spec）— AgentYml/ToolFileYml 契约
- `apps/api/src/ai/` — llm/（pi-model.factory、llm-config.service、llm-crypto、llm.service）、tools/（registry、executor、schema-validator）、agents/（yaml.loader、prompt-template、runtime、run.service）、ai.module.ts、definitions/*.yml ×3
- `apps/api/src/modules/ai/` — 三 tRPC router（agents 带 spec）+ REST controller + services
- `apps/api/src/types/pi-ai-subpaths.d.ts` — pi ESM-only 子路径类型补充
- `apps/admin/src/modules/ai/` — LlmConfigListPage/Form、AgentListPage、AgentDetailPage、AgentPlaygroundPage、ToolListPage
- `apps/admin/src/shared/utils/ssePost.ts` — fetch 流式 SSE 解析
- `infra/database/prisma/migrations/20261012144857_ai_three_layer/`
- `docs/adr/005-native-ai-three-layer.md`

**删除：**

- `apps/api/src/llm/`（旧抽象层，被 src/ai/llm/ 取代）
- `apps/api/src/modules/agents/` 与 `apps/admin/src/modules/agents/`（旧 Dify 集成模块）

**修改：**

- `infra/database/prisma/schema.prisma` + `seed.ts` — LlmConfig/AgentRun 新增、Agent 瘦身重建、权限同步
- `infra/shared/src/permissions/registry.ts`、`index.ts`、`index.spec.ts`、`tsconfig.json`
- `apps/api` — app.module/app.router 接线、error-codes、nest-cli.json（yml assets）、package.json（pi 依赖）、prisma-mock、main.ts
- `apps/admin` — App.tsx resources/Route、AdminLayout menuConfig
- `CLAUDE.md`（根/api/admin）、`docs/ROADMAP.md`、`docs/adr/README.md`、`docs/ops/env-configuration-guide.md`、`docs/product/backlog.md`（E3 划线）、`.env.example`、`pnpm-lock.yaml`
