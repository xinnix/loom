# weSale 基建回哺 loom 实施计划

**目标**：把评估报告第一梯队 5 项（#1 LLM 可观测、#2 Settings、#3 AgentTrigger、#4 Admin 组件增量、#5 文档方法论）分 5 个批次吸收进 loom，每批独立可验收、可合并。总工作量约 **9–12 人日**。全程遵循仓库治理流程（backlog epic → ADR → task 文档 → 完成回写）。

**顺序依据**（依赖单向无环）：A 先行是为 B/D 提供前置组件能力（深链、行操作共存）；B 的成本归因、D 的灰度门控都依赖 C 的 SettingsService。

---

## 批次 0：立项与文档修正（~0.5 天，纯文档）

- 修正评估报告三处事实：cron 实为**静默忽略**（无 warn 代码）；super_admin 直通 loom 后端三处（REST guard / tRPC permissionProcedure / 菜单过滤）**均已存在**，仅缺前端 PermissionGuard 组件；#1 需补 LlmConfig 单价字段迁移说明
- `docs/product/backlog.md` 立项：新增 E11–E15 五个 epic（做什么/为什么/来源指向评估报告编号），并首次采用 weSale 的「拍板 + 触发条件」格式
- 补 ADR-006 在 `docs/adr/README.md` 与根 CLAUDE.md 索引表中的缺失条目
- 每批建一份 `docs/task/active/` 任务文档（按 TEMPLATE.md，单任务单文档惯例）
- 评估报告基线注记 weSale 已前进至 `448441e`

## 批次 A：#4 组件增量 + #5 文档方法论（~1 天，无 ADR）

- `StandardListPage`：移植 `autoOpenEditParam`（URL `?key=value` 深链自动打开编辑 Modal，~50 行）与 `showDefaultRowActions`（内置行操作与 `renderRowActions` 插槽共存，~30 行），配套 `__tests__` 用例
- 前端 `PermissionGuard.tsx`：加 super_admin 直通（保留 `PermissionKey` 类型安全），与后端三处口径对齐
- `doc-framework.md`（156 行，自称可整篇复制）落入 `docs/`，`docs/README.md` 加索引
- 验收：组件用例绿；浏览器实测 `?key=value` 深链打开编辑 Modal；superadmin 直通渲染

## 批次 B：#1 LLM 用量埋点 + Admin 看板（~4–5 天，ADR-007）

**ADR-007「LLM 调用观测层」**：记录与 AgentRun 正交边界（AgentRun 记一次 agent 执行，LlmCallLog 记一次 LLM 请求）；隐私红线「不落 prompt/出参全文」；loom 特有设计点——**loop 节点绕过 LlmService 直连 pi**，埋点必须覆盖两条路径。

- **Schema**：`LlmCallLog` 表（traceId/sceneKey/callType/status/token/延迟/成本字段 + 四索引）；`LlmConfig` 加 `inputPricePer1M/outputPricePer1M Float?`。注意 loom 无 Prisma enum 惯例 → weSale 的两个 enum 改 **String + Zod 枚举**。走 `/db-migrate` 生成迁移（CI migration-check 强制），`prisma-mock.ts` 登记
- **API**（机制原样搬，weSale 实测 196+269 行）：`LlmTraceService`（双缓冲 500ms/50 条、背压 5000 封顶、30 天 retention @Cron、成功采样/错误恒记）+ `llm-usage-agg.ts` 纯函数（四维透视 + 成本三链：config 单价 → env 兜底 → chars÷1.6 估算）+ `llmUsage` router（挂 `AI_TRPC_ROUTERS`）；引入 `@nestjs/schedule`（批次 D 复用）
- **埋点落点**：`LlmService.chatWith/chatStreamWith`（chat 节点路径）+ `agent-runtime.service.ts` loop 节点 streamSimple 回调（L268/L344）；`runId` 作 traceId、`agentSlug` 作 sceneKey、`resolveLlmForNode` 处记录 llmConfigId
- **golden 断言迁移**：「埋点零行为改变」——埋点前后 agent-runtime/llm 既有 spec 输出一致；机制级 spec（日桶边界/背压/采样/成本数值断言）原样搬
- **Admin**：AI 用量看板页（570 行改写：`SCENE_LABELS` 换 loom agent 注册表、「去调优」深链指向 AgentListPage——消费批次 A 的 `autoOpenEditParam`）；recharts 已在 deps 零新增；权限 `llmusage:read` 进 registry + seed-base.sql；路由挂 `/ai/usage`
- 验收：四维透视正确、成本三链数值断言、golden 不变、看板浏览器实测（7/14/30 天切换 + 明细筛选）

## 批次 C：#2 Settings 参数中心（~1.5–2 天，ADR-008）

**ADR-008「平台参数中心」**：DB→env→derived 三层解析；显式注入 SettingsService；铁律「禁止 re-declare 全局 ConfigService token」随 ADR + 独立 dev 文档（weSale 生产事故教训）落 `docs/dev/`。

- **infra/shared/src/settings/**：catalog 最小化——仅 base 组 + llm 组（`LLM_INPUT/OUTPUT_PRICE_PER_1M` 两兜底键），SettingFieldDef 结构原样；挂 `src/index.ts` 出口
- **API**：`SettingsService`（机制与全部机制级 spec 原样搬：DB 优先/env 回落/别名/派生/脱敏视图/setMany 白名单/启动容错）+ `SystemSetting` 表迁移 + settings router + main.ts 兜底 reload
- **Admin**：SettingsPage（314 行改写：只留 base/llm 组）
- **#1 联动**：`llm-usage-agg` 的全局价格兜底键从 env 直读切换为 `settings.get()`
- 验收：机制 spec 全绿；配置页改价 → 看板成本口径即时生效

## 批次 D：#3 AgentTrigger 定时触发（~2–3 天，ADR-009）

**ADR-009「定时触发」**：打开 ADR-005 MVP 边界；形态泛化 **cron → run(agentSlug)**；双源模式——YML `triggers.cron` 权威 expression/slug，loader 启动 upsert `AgentTrigger` 行（与 `syncAgentRows` 同型），DB 权威 enabled；`triggeredByType` 增加 `'trigger'` 值；M4 第 4 步的 ADR 顺延至 010+。

- **Schema**：`AgentTrigger` 表（`agentSlug` 引用替代 weSale 三个业务 action 枚举；schedule 白名单 HOURLY/DAILY_04/DAILY_09/DAILY_21 用 String；保留 nextRunAt CAS 水位字段）
- **API**：dispatcher（`@Cron` 整点扫表 → CAS `updateMany` 抢占 → 建 AgentRun 审计行 → 终态回写；灰度门控 `AGENT_TRIGGER_ENABLED` 走 SettingsService）+ `compute-next-run.ts` 纯函数 + runner（调 `runtime.run(slug, input, { triggeredByType: 'trigger', write: noop })`，签名已核实在 `ai-agents.controller.ts:123`）
- **YML 联动**：`agent-yaml.loader.ts` 读取 `def.triggers.cron` 并 upsert；「预留忽略」变为真实现
- **Admin**：AgentTriggerListPage（消费批次 A 的 `showDefaultRowActions`：「立即执行」与编辑/删除共存）+ 运行历史复用现有 `agents.runs`
- 铁律随代码：带 @Cron 服务单一 Module 声明；dispatcher/computeNextRun 的机制级 spec 原样搬，runner spec 按 run(slug) 泛化重写
- 验收：门控关闭零动作、CAS 并发抢占幂等、崩溃留 RUNNING 孤儿不重放、YML 改 expression 重启后生效

## 批次 E（可选）：#6 pi provider 护栏验证（~0.5–1 天）

- 独立验证任务，可插队：DeepSeek/Qwen thinking 模型多轮工具循环实测 loom pi 流水线（`include_usage` 400 / reasoning_content 回填 / thinking 参数归一），缺什么补什么到 `pi-model.factory.ts` / `LlmService` 层，验收标准 = 实测场景零 400

---

## 贯穿性配套（每批执行时）

- schema 改动走 `/db-migrate` + `/sync`，迁移文件必须入库；新模型登记 `prisma-mock.ts`
- 新权限进 `permissions/registry.ts` + `seed-base.sql`；shared 新域挂 `index.ts` 出口并跑 build
- 每批完成回写：task 文档移 `completed/`、ROADMAP 补产物+日期（挂 M4）、backlog epic 划掉、新模块过 `module-health-checklist.md`
- 已知边界：E2E 在 CI 不可跑（E5 前提），浏览器验证走本地 `/start-all`

## 风险提示

1. **loop 节点埋点缺口**是 loom 特有设计点（weSale 无此路径），ADR-007 必须写清双路径覆盖，否则用量统计会系统性偏低
2. weSale 的 enum/业务耦合点共 11 处（盘点已列清单），移植时逐项改写而非照搬
3. 批次 B 工作量最大且有 schema 迁移，若需要可再拆「采集先行、看板随后」两个 PR
