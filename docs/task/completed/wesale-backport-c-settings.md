# 任务：weSale 回哺批次 C——平台参数中心（E12）

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-10-14
- **标签**：`feature`
- **关联**：[ADR-008](../../adr/008-settings-platform-parameters.md)、[注入铁律](../../dev/settings-config-injection.md)；消费 ADR-007 价格兜底键；为批次 D 提供灰度门控载体

## 目标

落地 SettingsService 三层读取链（DB→env→derived）+ 最小字段目录 + Admin 配置页，并切换 ADR-007 价格兜底与 LLM 静态兜底链为 settings.get。

## 检查清单

- [x] ADR-008 + 注入铁律 dev 文档（`docs/dev/settings-config-injection.md`，weSale 生产事故教训随机制回传）+ 两处索引
- [x] `infra/shared/src/settings/`：类型 + 最小目录（base + llm 两组 8 字段，只收 loom 已有 env 业务键）+ tRPC 入参 Zod
- [x] schema：SystemSetting 表（迁移 `20261014025542_system_settings`）
- [x] `shared/settings/settings.service.ts`：机制原样移植（三层读取/版本号/白名单写入/脱敏视图/启动容错）+ 挂 SharedModule（@Global）
- [x] main.ts：setSettingsService + listen 前兜底 reload（双保险）
- [x] settings router（groups/getGroup/saveGroup）挂 appRouter；权限 `settings:read/update` + `menu:settings` 入 registry + seed-base.sql
- [x] 联动切换：llm-usage router 价格兜底 getSettingsService()；LlmConfigService.resolveFromEnv 三键走 settings（@Optional 缺省回退 process.env 保单测）
- [x] Admin：SettingsPage（分组 Tab + 目录驱动表单 + 来源徽标 + 掩码）挂 `/settings` + 系统管理菜单
- [x] 测试：settings.service.spec 6 例（机制级移植）——api 全量 143 例绿、双端 tsc 绿

## 当前状态

> **做到哪了：** 全部完成。
> **卡在哪：** 无。
> **下一步：** 批次 D（E13 AgentTrigger 定时触发，ADR-009），灰度门控键 `AGENT_TRIGGER_ENABLED` 将入 llm 组目录。
> **决策上下文：** SettingsService 落 SharedModule（@Global）而非 modules/——ai 基础设施层（LlmConfigService）需要注入它，避免 ai→modules 反向依赖；目录最小化拍板照评估报告，不做投机扩展；别名/派生机制保留但当前为空。

## 变更文件清单

| 文件                                                                 | 变更      | 原因                     |
| -------------------------------------------------------------------- | --------- | ------------------------ |
| `infra/shared/src/settings/*`（2 文件）                              | 新增      | catalog SSOT + barrel    |
| `infra/shared/src/index.ts`                                          | 修改      | 挂 settings 出口         |
| `infra/database/prisma/schema.prisma` + 迁移                         | 修改/新增 | SystemSetting            |
| `infra/shared/src/permissions/registry.ts` / `seed-base.sql`         | 修改      | settings 权限            |
| `apps/api/src/shared/settings/settings.service.ts` + spec            | 新增      | 机制 + 6 例              |
| `apps/api/src/shared/shared.module.ts`                               | 修改      | 注册 SettingsService     |
| `apps/api/src/trpc/trpc.ts` / `main.ts`                              | 修改      | setter + 兜底 reload     |
| `apps/api/src/modules/settings/*`（3 文件）                          | 新增      | module + router + barrel |
| `apps/api/src/trpc/app.router.ts`                                    | 修改      | settings 注册            |
| `apps/api/src/modules/ai/trpc/llm-usage.router.ts`                   | 修改      | 价格兜底切 settings      |
| `apps/api/src/ai/llm/llm-config.service.ts`                          | 修改      | 静态兜底链走 settings    |
| `apps/api/src/test/prisma-mock.ts`                                   | 修改      | systemSetting 登记       |
| `apps/admin/src/modules/settings/*` + App/AdminLayout                | 新增/修改 | 配置页 + 路由 + 菜单     |
| `docs/adr/008-*.md` + 索引 + `docs/dev/settings-config-injection.md` | 新增      | 决策与铁律               |

## 备注

- weSale 源：`modules/settings/settings.service.ts`（机制原样）、`settings-catalog.ts`（结构照搬、条目最小化）、`SettingsPage.tsx`（改写）、`docs/dev/settings-config-injection-refactor.md`（铁律全文改编）
- 浏览器实测（配置页改价 → 用量看板成本口径）待本地起服补验
