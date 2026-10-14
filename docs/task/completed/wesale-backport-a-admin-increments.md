# 任务：weSale 回哺批次 A——Admin 组件增量 + 文档方法论（E14+E15）

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-10-14
- **标签**：`feature`
- **关联**：[wesale-backport-assessment](../../dev/wesale-backport-assessment.md) #4/#5；后续批次 B（E11 LLM 可观测）将消费本批深链能力

## 目标

移植 weSale 的 StandardListPage 深链能力与前端 super_admin 直通，吸收 doc-framework 方法论增量——为批次 B「AI 用量看板 → LlmConfig 调优」深链闭环打前站。

## 检查清单

- [x] StandardListPage `autoOpenEditParam`（URL `?param=value` 命中行同名字段自动打开编辑 Modal；当前页未命中按字段直查兜底；清参数防重开）
- [x] 前端 PermissionGuard super_admin 直通（与后端 REST guard / tRPC permissionProcedure / AdminLayout 菜单过滤四处口径对齐）
- [x] 组件用例：autoOpenEditParam 4 例（命中/兜底直查/查无不打开/无参数）+ PermissionGuard 3 例（直通/有权限/无权限）
- [x] doc-framework 增量并入 docs/README.md（优先级约定 + 反模式清单 7 条；不另立方法论文档，README 即唯一实例）
- [x] ~~showDefaultRowActions 移植~~（不移植：loom `renderRowActions(record, helpers)` 组合参数已覆盖「内置操作与插槽共存」且更灵活，移植会形成双 API）

## 当前状态

> **做到哪了：** 全部完成，12 个组件用例绿（StandardListPage 9 + PermissionGuard 3）。
> **卡在哪：** 无。
> **下一步：** 批次 B（E11 LLM 用量埋点 + 看板，ADR-007）。
> **决策上下文：** 评估报告 #4 勘误——super_admin 直通 loom 后端三处已有，仅缺前端组件；showDefaultRowActions 与 loom 已有 helpers 机制重叠故不移植；doc-framework 整篇复制会与 docs/README.md 形成双 SSOT（正是其反模式清单第 2/4 条），故只并入增量。

## 变更文件清单

| 文件                                                                                    | 变更 | 原因                                          |
| --------------------------------------------------------------------------------------- | ---- | --------------------------------------------- |
| `apps/admin/src/shared/components/StandardListPage/types.ts`                            | 修改 | 新增 `autoOpenEditParam` prop 与 JSDoc        |
| `apps/admin/src/shared/components/StandardListPage/index.tsx`                           | 修改 | 深链 effect（命中/兜底直查/清参数）           |
| `apps/admin/src/shared/components/PermissionGuard.tsx`                                  | 修改 | super_admin 直通                              |
| `apps/admin/src/shared/components/StandardListPage/__tests__/StandardListPage.spec.tsx` | 修改 | mock 数据可注入 + 4 个深链用例                |
| `apps/admin/src/shared/components/__tests__/PermissionGuard.spec.tsx`                   | 新增 | 直通/权限用例                                 |
| `docs/README.md`                                                                        | 修改 | 优先级约定 + 反模式清单（doc-framework 增量） |
| `docs/product/backlog.md`                                                               | 修改 | E14 行更新（showDefaultRowActions 不移植）    |

## 备注

- weSale 源：`apps/admin/src/shared/components/StandardListPage/StandardListPage.tsx` L170-212（深链）、`PermissionGuard.tsx`（直通）；引入 commit `2ceef62` / `81a70d0`。
