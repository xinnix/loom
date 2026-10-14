# ADR-007: LLM 调用观测层（用量埋点管线 + Admin 看板）

- **日期**：2026-10-14
- **状态**：✅ 已采纳
- **关联**：ADR-005（AI 三层架构）、[backlog E11](../product/backlog.md)、[wesale-backport-assessment #1](../dev/wesale-backport-assessment.md)

## 背景

loom 的 AI 运行时只有 run 级汇总：`AgentRun.usage`（calls/promptTokens/completionTokens/totalTokens 的 JSON 聚合）。无法回答「哪个 agent/模型花了多少钱、错误率与延迟分布如何、一次 run 内每次 LLM 请求的明细」——ai-native-roadmap 第 5 步「成本报表」缺乏数据底座。

weSale 已在生产验证过一套请求级观测管线（LlmCallLog + 双缓冲写入 + 四维透视看板），本 ADR 记录其回哺到 loom 的架构决策。

## 决策

1. **新增 `LlmCallLog` 表，与 `AgentRun` 正交**：AgentRun 记一次 agent 执行（业务审计），LlmCallLog 记一次 LLM 请求（资源观测）。一次 run 可对应多条流水（loop 节点多轮工具循环）。
2. **归因口径**：`traceId = AgentRun.id`（一次 run 的多次调用共享，明细可按 run 汇观）；`sceneKey = agentSlug`；`llmConfigId` 记解析到的配置行 id（env 兜底配置为空）；`props` 存 nodeId/configKey 扩展元数据。
3. **埋点双路径覆盖（loom 特有）**：chat 节点经 `LlmService.chatStreamWith`（`models.stream`），loop 节点绕过 LlmService 直连 pi（`handle.models.streamSimple`）。两条路径统一用「旁听 `EventStream.result()`」的观察器落流水——不消费、不改写、不转发任何事件，消费方行为零差异。
4. **写入管线（附属设施，永不阻断业务）**：`LlmTraceService` 同步双缓冲（500ms / 满 50 条批量 `createMany`）、背压封顶 5000 条、写失败节流告警丢弃不重试、错误/超时/中止恒记录（成功可经 `LLM_TRACE_SAMPLE_RATE` 采样）、`@Cron` 30 天 retention、优雅停机 flush。
5. **成本归因三链**：llmConfigId → `LlmConfig.inputPricePer1M/outputPricePer1M` → 全局兜底键（`LLM_INPUT/OUTPUT_PRICE_PER_1M`，Settings 参数中心 ADR-008 就位前 env 直读）→ 无 token 组按 chars÷1.6 估算。**定位归因而非计费**（±10%）。
6. **隐私红线**：不落 prompt/出参全文；errorMsg 截 200 字；不含 apiKey（沿 ADR-005 日志脱敏惯例）。
7. **Admin 看板**：`/ai/usage` 只读页（总览四维透视 + 明细流水 + Drawer 详情），权限独立 resource=`llmusage:read`；明细「查看模型配置」深链复用 `StandardListPage.autoOpenEditParam`。

## 权衡

**优点**

- 请求级观测补齐 run 级汇总盲区；成本可归因到 agent/模型/配置
- 埋点零行为改变（旁听 result()，golden 断言固化），trace 服务缺省时零开销
- 管线抗压：DB 抖动只丢流水不伤业务调用

**缺点**

- 每次请求多一次批量写（500ms 合并后摊薄）
- 成本靠单价配置与 chars 估算，非精确计费
- retention 30 天，长期趋势需另建聚合表（未做）

## 实施要点

- 迁移 `20261014024010_llm_call_log_observability`（LlmCallLog 表 + LlmConfig 单价字段）
- 状态/类型用 String + 注释（无 Prisma enum 惯例），Zod 侧未额外建 schema（router 内联入参校验）
- `@Cron` 铁律：带 retention 的 `LlmTraceService` 只在 `LlmTraceModule` 声明一次；`ScheduleModule.forRoot()` 挂 AppModule
- golden 断言：`llm.service.spec.ts`（无 trace 零埋点 / 有 trace 恰好一次）+ agent-runtime 既有 spec 原样通过

## 后续考虑

- Settings 参数中心（ADR-008）就位后，价格兜底键与 `LLM_TRACE_SAMPLE_RATE` 迁入 DB 配置
- 采样率分级（按 sceneKey 差异化）、错误分类细化（http_4xx/5xx 已预留 errorClass 值域）
- 长期趋势：若 30 天不够，增加日聚合表而非延长明细 retention
