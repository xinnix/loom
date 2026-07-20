# 任务：架构治理 — 健康检查清单 + CLAUDE.md 补充 + ADR

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-07-20
- **标签**：`infra` | `docs`
- **关联**：[未来方向文档](../../future-directions.md)

## 目标

补充项目的架构治理设施：模块健康检查清单写入 CLAUDE.md，创建 ADR 目录记录关键架构决策，补充依赖治理和废弃模块清理规则。

## 检查清单

- [x] 补充 Root CLAUDE.md 的架构治理章节（健康检查清单 + 依赖治理 + 废弃模块清理）
- [x] 创建 docs/adr/ 目录并记录首批 3 个架构决策（双协议、Refine+AntD、声明式UI）
- [x] 补充 apps/api/CLAUDE.md 的模块创建和依赖治理规则
- [x] 补充 apps/admin/CLAUDE.md 的页面创建和依赖治理规则
- [x] 更新 Module Registry（AgentDetailPage、UserDetailPage、RoleDetailPage）

## 当前状态

> **做到哪了：** 架构治理完成。Root CLAUDE.md 新增「架构治理」章节含三大规则 + ADR 引用；docs/adr/ 目录含 3 个 ADR + 索引；api/admin CLAUDE.md 补充领域治理规则
> **卡在哪：** 无
> **下一步：** 验证变更完整性，确认无遗漏

## 变更文件清单

| 文件                                         | 变更 | 原因                                        |
| -------------------------------------------- | ---- | ------------------------------------------- |
| `CLAUDE.md`                                  | 修改 | 新增「架构治理」章节 + 更新 Module Registry |
| `apps/api/CLAUDE.md`                         | 修改 | 新增 API 端模块创建和依赖治理规则           |
| `apps/admin/CLAUDE.md`                       | 修改 | 新增 Admin 端页面创建和依赖治理规则         |
| `docs/adr/README.md`                         | 新增 | ADR 索引目录                                |
| `docs/adr/001-dual-protocol-architecture.md` | 新增 | ADR-001 双协议架构                          |
| `docs/adr/002-refine-antd-frontend.md`       | 新增 | ADR-002 Refine + Ant Design                 |
| `docs/adr/003-standardized-ui-pattern.md`    | 新增 | ADR-003 声明式 UI 模式                      |

## 备注

- 健康检查清单写入 CLAUDE.md 后，Agent 在开发新模块时可自动对照
- ADR 目录采用轻量模板，无需工具支撑，纯 Markdown
- 后续新增 ADR 只需复制 003 的模板结构
