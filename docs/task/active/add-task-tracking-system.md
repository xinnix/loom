# 任务：添加任务追踪系统

## 元信息

- **状态**：`active`
- **分支**：`main`
- **创建**：2026-07-13
- **标签**：`infra`, `docs`

## 目标

为脚手架建立一套持久化的任务追踪机制，让 Agent 在开发时将计划和进度写入 `docs/task/`，跨会话也能恢复上下文。

## 检查清单

- [x] 设计整体方案并确认用户决策
- [x] 创建 `docs/task/README.md` 看板索引
- [x] 创建 `docs/task/TEMPLATE.md` 任务模板
- [x] 创建 `docs/task/active/` 和 `docs/task/completed/` 目录
- [x] 创建 `.claude/skills/task/SKILL.md` 技能
- [x] 创建 `.claude/commands/task.md` 快捷命令
- [x] 更新 `CLAUDE.md` 加入任务追踪规则

## 当前状态

> **做到哪了：** 全部完成，已交付给用户审查
> **卡在哪：** 无
> **下一步：** 等待用户确认或提出调整意见
> **决策上下文：** （无变更）

## 变更文件清单

| 文件                                           | 变更 | 原因               |
| ---------------------------------------------- | ---- | ------------------ |
| `docs/task/README.md`                          | 新增 | 任务看板索引       |
| `docs/task/TEMPLATE.md`                        | 新增 | 任务文档模板       |
| `docs/task/active/`                            | 新增 | 进行中任务存放目录 |
| `docs/task/completed/`                         | 新增 | 已完成任务存档目录 |
| `docs/task/active/add-task-tracking-system.md` | 新增 | 本任务自身         |
| `.claude/skills/task/SKILL.md`                 | 新增 | 任务追踪技能定义   |
| `.claude/commands/task.md`                     | 新增 | `/task` 快捷命令   |
| `CLAUDE.md`                                    | 修改 | 加入任务追踪节     |

## 备注

- 用户要求：每个功能分支一个文件、自动化的 skill、CLAUDE.md 声明
