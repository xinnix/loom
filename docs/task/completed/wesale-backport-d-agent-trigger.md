# 任务：weSale 回哺批次 D——Agent 定时触发（E13）

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-10-14
- **标签**：`feature`
- **关联**：[ADR-009](../../adr/009-agent-scheduled-trigger.md)；消费批次 A（helpers 组合）、批次 C（灰度门控键）、受益于批次 B（触发产生的调用进观测）

## 目标

落地泛化定时触发：AgentTrigger 表 + CAS 抢占 dispatcher + run(agentSlug) 执行器 + YML triggers.cron 运行时生效 + 管理面。

## 检查清单

- [x] ADR-009 + 索引；api CLAUDE.md 补 @Cron 单一 Module 声明铁律
- [x] schema：AgentTrigger 表（迁移 `20261014030246_agent_triggers`）；AgentRun.triggeredByType 增加 'trigger'
- [x] `ai/agent-trigger/`：compute-next-run（纯函数 + YML expression→白名单映射）/ service（BaseService，nextRunAt 服务端计算）/ runner（run(slug) + noop emit + trigger 上下文）/ dispatcher（@Cron 整点 + 灰度门控 + CAS 抢占）
- [x] YML 联动：loader syncTriggerRows（YML 权威存在性/schedule，DB 权威 enabled/input，manual 行不受影响）——「静默忽略」变为真实现
- [x] 灰度门控：`AGENT_TRIGGER_ENABLED` 入 settings catalog automation 组（默认关闭）
- [x] 管理面：agentTriggers router（CRUD+runOnce+slugs）挂 AI_TRPC_ROUTERS；Admin `/ai/agent-triggers`（「立即执行」+helpers 编辑/删除组合）；权限 agentTrigger:crud+run + menu
- [x] 测试：compute-next-run 5 例（含 expression 映射与跨日边界）+ dispatcher 5 例（门控/CAS 抢占/并发跳过/失败不中断/runOnce）+ runner 2 例（trigger 上下文与 noop emit）

## 当前状态

> **做到哪了：** 全部完成。api 155 例绿、双端 tsc 绿、迁移已应用、权限已入库。
> **卡在哪：** 无。浏览器端到端（页面交互 + 开启灰度门控实跑一次触发）待本地起服补验。
> **下一步：** 批次 E（pi provider 护栏验证）为可选独立项，需 DeepSeek/Qwen 真实 API key 实测，另行安排。
> **决策上下文：** 不照搬 weSale 的「dispatcher 自建 AgentRun 审计壳」——loom 的 runtime.run 单点持有 run 生命周期，审计复用即无孤儿壳；白名单扩为 DAILY_HH 全 24 小时（String 列 + Zod regex，非固定枚举），YML 任意 cron 表达式回 ADR 重评（触发条件已挂 backlog 拍板记录）。

## 变更文件清单

| 文件                                                                                               | 变更      | 原因                                  |
| -------------------------------------------------------------------------------------------------- | --------- | ------------------------------------- |
| `infra/shared/src/index.ts`                                                                        | 修改      | AgentTrigger Zod 契约                 |
| `infra/shared/src/settings/catalog.ts`                                                             | 修改      | automation 组 + AGENT_TRIGGER_ENABLED |
| `infra/shared/src/permissions/registry.ts` / `seed-base.sql`                                       | 修改      | agentTrigger 权限                     |
| `infra/database/prisma/schema.prisma` + 迁移                                                       | 修改/新增 | AgentTrigger + triggeredByType 扩值   |
| `apps/api/src/ai/agent-trigger/*`（8 文件）                                                        | 新增      | 模块五件 + 三份 spec                  |
| `apps/api/src/ai/agents/agent-yaml.loader.ts`                                                      | 修改      | syncTriggerRows                       |
| `apps/api/src/ai/agents/agent-runtime.service.ts` / `agent-run.service.ts` / `tools/interfaces.ts` | 修改      | 'trigger' 类型扩展                    |
| `apps/api/src/modules/ai/module.ts` + `trpc/agent-triggers.router.ts`                              | 修改/新增 | router 注册                           |
| `apps/api/src/app.module.ts`                                                                       | 修改      | AgentTriggerModule                    |
| `apps/api/src/test/prisma-mock.ts`                                                                 | 修改      | agentTrigger 登记                     |
| `apps/admin/src/modules/ai/pages/AgentTriggerListPage.tsx` + `components/AgentTriggerForm.tsx`     | 新增      | 管理面                                |
| `apps/admin/src/App.tsx` / `modules/ai/index.ts` / `AdminLayout.tsx`                               | 修改      | 路由/导出/菜单                        |
| `apps/api/CLAUDE.md`                                                                               | 修改      | @Cron 铁律 + Settings 注入铁律        |
| `docs/adr/009-*.md` + 索引                                                                         | 新增      | ADR-009                               |

## 备注

- weSale 源：`modules/agent-trigger/services/`（dispatcher/computeNextRun 机制级原样；runner 按 run(slug) 泛化重写；router 换 createCrudRouterWithCustom）
- 启用路径：平台参数页 automation 组开 AGENT_TRIGGER_ENABLED → YML agent 的 `triggers.cron: {enabled: true, expression: '0 9 * * *'}` 重启后自动建 `source='yml'` 触发器
