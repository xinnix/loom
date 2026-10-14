# ADR-009: Agent 定时触发（泛化 cron → run agent）

- **日期**：2026-10-14
- **状态**：✅ 已采纳
- **关联**：ADR-005（打开其 MVP 边界「cron/队列触发」预留项）、ADR-008（灰度门控键载体）、[backlog E13/E9](../product/backlog.md)、[wesale-backport-assessment #3](../dev/wesale-backport-assessment.md)

## 背景

ADR-005 将「cron/队列异步触发」列入 MVP 边界外预留；YML `TriggersSchema.cron` 自那时起只做校验、运行时静默忽略（全仓无处理代码，2026-10-14 核验）。weSale 已生产验证一套定时触发机制（CAS 抢占 / 白名单调度 / 灰度门控 / 幂等），本 ADR 记录其泛化回哺：weSale 的动作是业务专属枚举（GENERATE_TASK 等），loom 泛化为 **run(agentSlug)**。

## 决策

1. **泛化形态**：`AgentTrigger { name, agentSlug, schedule, input?, source, enabled, lastRunAt, nextRunAt }`；执行 = `runtime.run(agentSlug, input, { permissions: [], userType: 'trigger', triggeredByType: 'trigger' }, noop)`。
2. **调度白名单（非任意 cron）**：`HOURLY | DAILY_HH`（00-23 整点，Zod regex 同源，String 列零迁移）。YML `triggers.cron.expression` 经 `cronExpressionToSchedule` 映射：`0 * * * *` → HOURLY、`0 H * * *` → DAILY_HH；其余形态 loader warn 跳过。
3. **双源约定（与 syncAgentRows 同型）**：YML 权威存在性与 schedule（loader 启动同步 `source='yml'` 行，YML 移除/禁用 cron 即删行）；DB 权威 enabled/input（管理端可暂停 YML 触发器而不被覆盖）；管理端手建行 `source='manual'` 不受 YML 同步影响。
4. **幂等与不重放**：dispatcher `@Cron` 整点扫表 → **CAS 原子抢占**（`updateMany({ where: { id, nextRunAt: 读值 } })`，count=0 即已被并发实例抢占）→ 水位推进后才执行。抢占后崩溃 = 该时段丢失不重放；执行中崩溃 = runtime 自落 failed AgentRun。
5. **审计复用**：不另造审计壳——AgentRun 由 `runtime.run` 单点创建并终态化，`triggeredByType='trigger'` 归因；`runOnce` 手动执行不推进水位。
6. **灰度门控**：`AGENT_TRIGGER_ENABLED`（Settings 参数中心 automation 组，**默认关闭**）非 `'true'` 时 dispatcher 零动作。
7. **权限边界**：trigger 上下文 `permissions=[]`——YML 声明了 `permission` 的工具对定时触发一律阻断；写操作类能力留给 M4 第 4 步 human-in-the-loop 审批链。

## 权衡

**优点**

- 多实例部署天然幂等（CAS）；崩溃语义明确（丢不重放）
- 泛化 run(slug) 使任何 YML agent 可被定时化，零业务代码
- YML 双源约定与既有 Agent 同步模式一致，认知零新增

**缺点**

- 白名单形态不支持任意 cron 表达式（分钟级/周几），YML 超出形态静默跳过仅 warn
- 整点对齐扫描，最长延迟近 1 小时才执行到期任务（对报表类场景可接受）

## 实施要点

- 迁移 `20261014030246_agent_triggers`
- `ai/agent-trigger/`：compute-next-run（纯函数）+ service（BaseService，nextRunAt 服务端计算）+ runner + dispatcher（@Cron 单一 Module 声明铁律）
- 管理面：`agentTriggers` router 挂 AI_TRPC_ROUTERS（CRUD + runOnce + slugs）；Admin `/ai/agent-triggers` 列表页（「立即执行」与内置编辑/删除经 renderRowActions helpers 组合）
- 权限 `agentTrigger:crud+run` + `menu:agentTriggers`

## 后续考虑

- 需要任意 cron 表达式 / 分钟级调度时，回本 ADR 重评（引入 cron 解析器或将白名单扩为表达式列）——backlog 拍板记录已挂此触发条件
- 队列触发与 durable 断点续跑仍为 E9 范畴，本 ADR 不动
- 触发器执行结果通知（失败告警）待观测数据积累后评估
