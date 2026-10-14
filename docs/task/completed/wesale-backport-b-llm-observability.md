# 任务：weSale 回哺批次 B——LLM 调用观测层（E11）

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-10-14
- **标签**：`feature`
- **关联**：[ADR-007](../../adr/007-llm-call-observability.md)；前置批次 A（深链能力）；后续批次 C（Settings 承接价格兜底键）

## 目标

落地请求级 LLM 用量观测：LlmCallLog 埋点管线（双路径覆盖）+ 四维透视聚合 + Admin「AI 用量」看板 + LlmConfig 单价成本归因。

## 检查清单

- [x] ADR-007 + 索引回填（adr/README、CLAUDE.md）
- [x] schema：LlmCallLog 表 + LlmConfig 单价字段（迁移 `20261014024010_llm_call_log_observability`）
- [x] `ai/llm-trace/`：LlmTraceService（双缓冲/背压/retention）+ traceLlmStream 观察器 + llm-usage-agg 纯函数 + LlmTraceModule（@Cron 单一声明铁律）
- [x] 双路径埋点：LlmService.chatWith/chatStreamWith（CHAT/CHAT_STREAM）+ agent-runtime loop 节点 streamSimple 包装（AGENT_LOOP）——统一旁听 `EventStream.result()`
- [x] ScheduleModule.forRoot() 挂 AppModule；LlmModule/AiModule 接线
- [x] llmUsage router（getOverview/getLogs）挂 AI_TRPC_ROUTERS；权限 `llmusage:read` + `menu:llmUsage` 入 registry + seed-base.sql（顺手补齐 seed 漏配的 llmConfig/aiTool/agent:run 权限）
- [x] Admin：LlmUsagePage（总览/明细双 Tab，recharts 趋势）挂 `/ai/usage` + 菜单；明细「查看配置」深链复用 autoOpenEditParam
- [x] LlmConfigForm/共享 Zod 契约加单价字段
- [x] 测试：llm-trace.service.spec 12 例（机制级移植）+ llm-usage-agg.spec 2 例（成本三链数值断言）+ llm.service.spec 6 例（golden：无 trace 零埋点/有 trace 恰好一次）；agent-runtime 既有 8 例原样通过（埋点零行为改变）
- [x] prisma-mock 登记 llmCallLog + createMany/groupBy delegate

## 当前状态

> **做到哪了：** 全部完成。api 137 例绿、shared 41 例绿、api/admin tsc 全绿、迁移已应用、权限已入库。
> **卡在哪：** 无阻塞。备注：本机开发库的 roles/role_permissions 主键为 cuid（历史经 prisma seed.ts 灌入），与 seed-base.sql 固定 id（r1/r2/r3）不匹配——seed 的角色绑定段 FK 报错属存量状态；superadmin 走直通不受影响，非超管角色绑定需在该库手工补（新环境用 seed-base.sql 直灌则无此问题）。
> **下一步：** 批次 C（E12 Settings 参数中心，ADR-008）——价格兜底键从 env 直读切换为 settings.get。
> **决策上下文：** loop 节点绕过 LlmService 直连 pi 是埋点关键风险点，最终方案是 pi 的 EventStream 自带 `result(): Promise<AssistantMessage>` 且终态消息自带 `durationMs`，两路径统一「旁听 result()」零行为改变；traceId=runId（一次 run 多条流水共享）而非每次调用独立 uuid。

## 变更文件清单

| 文件                                                                 | 变更      | 原因                                  |
| -------------------------------------------------------------------- | --------- | ------------------------------------- |
| `infra/database/prisma/schema.prisma`                                | 修改      | LlmCallLog 模型 + LlmConfig 单价字段  |
| `infra/database/prisma/migrations/20261014024010_*`                  | 新增      | 迁移                                  |
| `infra/database/prisma/seed-base.sql`                                | 修改      | llmusage/menu:llmUsage + 补漏配权限   |
| `infra/shared/src/index.ts`                                          | 修改      | LlmConfig 单价 Zod 字段               |
| `infra/shared/src/permissions/registry.ts`                           | 修改      | llmusage.read / menu.llmUsage         |
| `apps/api/src/ai/llm-trace/*`（5 文件）                              | 新增      | service/module/agg + 两份 spec        |
| `apps/api/src/ai/llm/llm.service.ts`                                 | 修改      | 埋点 + @Optional trace                |
| `apps/api/src/ai/llm/interfaces.ts` / `llm-config.service.ts`        | 修改      | LlmConfigResolved.id                  |
| `apps/api/src/ai/agents/agent-runtime.service.ts`                    | 修改      | runMeta 穿线 + loop streamSimple 包装 |
| `apps/api/src/ai/llm/llm.module.ts` / `app.module.ts`                | 修改      | LlmTraceModule / ScheduleModule 接线  |
| `apps/api/src/modules/ai/module.ts` + `trpc/llm-usage.router.ts`     | 新增/修改 | llmUsage router 注册                  |
| `apps/api/src/test/prisma-mock.ts`                                   | 修改      | llmCallLog + createMany/groupBy       |
| `apps/admin/src/modules/ai/pages/LlmUsagePage.tsx`                   | 新增      | 看板页                                |
| `apps/admin/src/App.tsx` / `modules/ai/index.ts` / `AdminLayout.tsx` | 修改      | 路由/导出/菜单+图标                   |
| `apps/admin/src/modules/ai/components/LlmConfigForm.tsx`             | 修改      | 单价输入                              |
| `docs/adr/007-*.md` + 两处索引                                       | 新增      | ADR-007                               |
| `docs/ROADMAP.md`                                                    | 修改      | M4 产物回写                           |

## 备注

- weSale 源：`apps/api/src/modules/llm-trace/`（机制原样）；`LlmUsagePage.tsx`（场景标签/深链目标按 loom 改写，SCENE_LABELS 12 键业务表弃用）
- 浏览器实测（看板空态渲染 + 深链）待本地起服后补验；单测与类型层面已闭环
