# ADR-008: 平台参数中心（Settings）

- **日期**：2026-10-14
- **状态**：✅ 已采纳
- **关联**：ADR-007（价格兜底键消费方）、[backlog E12](../product/backlog.md)、[wesale-backport-assessment #2](../dev/wesale-backport-assessment.md)

## 背景

loom 各模块的业务参数散落在环境变量（LLM_API_URL/KEY/MODEL 等），运行期不可改、不可脱敏展示、无灰度开关载体。派生项目（如 weSale）的实践证明「数据库参数 + env 兜底 + 管理页」是通用刚需，且踩过一个生产事故级的注入陷阱（见 [docs/dev/settings-config-injection.md](../dev/settings-config-injection.md)）。

## 决策

1. **三层读取链**：`SettingsService.get(key)` 同步返回 `DB SystemSetting → 环境变量 → 派生值`；启动预载全量缓存，写入后 reload 并递增 version。
2. **字段目录 SSOT 在 `infra/shared/src/settings/catalog.ts`**：元数据（label/type/isSecret/optional/options/help）只定义一处；DB 只存 key/value/group/isSecret。**目录最小化**：只收录 loom 已存在的 env 业务键（base 组 PUBLIC_API_URL + llm 组 LLM_API_URL/KEY/MODEL 与两个价格兜底键），不做投机性扩展——新键随消费它的特性立项时再加。
3. **显式注入，禁止 re-declare ConfigService token（铁律）**：需要 DB 配置的服务一律显式注入 `SettingsService`（@Global SharedModule 提供）；基础设施键（DATABASE_URL/JWT_SECRET/PORT）继续走原始 ConfigService/env。weSale 曾用 `{ provide: ConfigService, useClass: ... } }` 全局覆写实现 DB 优先，导致构造注入与 `app.get` 两种解析语义命中不同实例，酿成生产故障——该方案连同其教训一起被否决并文档化。
4. **写入白名单**：`setMany(group, values)` 按目录分组过滤，目录外键静默丢弃；isSecret 空串/null = 留空不修改；`$transaction(upsert)` 后 reload。
5. **脱敏契约**：`getGroupView` 对敏感值只回掩码（前 4 位 + ****），永不回明文。
6. **启动容错**：onModuleInit 失败不阻断启动（env 兜底仍有效）；main.ts 在 listen 前再兜底 reload 一次（Prisma 连接时序双保险）。
7. **消费方接线**：ADR-007 的成本兜底键（`LLM_INPUT/OUTPUT_PRICE_PER_1M`）与 `LlmConfigService` 的静态兜底链（原 env 直读三键）均切换为 `settings.get()`。

## 权衡

**优点**

- 运行期可改参数（价格、兜底模型），免重启免重新部署
- 显式注入无解析歧义；机制级测试可完整覆盖
- catalog 是共享 SSOT，Admin 配置页零硬编码

**缺点**

- 同步 get 依赖启动预载（全量缓存），设置键极多时内存与 reload 成本上升（当前 <10 键，可忽略）
- env 与 DB 双源可能造成「值从哪来」的困惑——以 `getSource()` 在配置页显式标注缓解

## 实施要点

- 迁移 `20261014025542_system_settings`
- `SettingsService` 挂 SharedModule（@Global）；tRPC 侧经 main.ts 的 `setSettingsService` 注入（与 setFileStorageService 同模式）；router 挂 `appRouter.settings`
- Admin `/settings` 页（分组 Tab + 目录驱动表单 + 来源徽标 + 掩码）
- 权限 `settings:read/update` + `menu:settings`

## 后续考虑

- 灰度/feature flag 键随具体特性立项进目录（如批次 D 的 `AGENT_TRIGGER_ENABLED`）
- 派生层（回调 URL 生成）在 loom 出现首个消费方时再填 `DERIVED_SETTINGS`
- 若未来键规模增长，考虑按键前缀的分组缓存或 LRU
