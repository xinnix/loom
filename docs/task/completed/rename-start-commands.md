---
status: completed
---

# 启动命令重命名与拆解

重命名 `start-backend` → `start-api`，拆解 `start-frontend` → `start-admin` / `start-web` / `start-landing`。

## 变更清单

### start-backend → start-api

| 操作 | 路径                                                 |
| ---- | ---------------------------------------------------- |
| 改名 | `.claude/commands/start-backend.md` → `start-api.md` |

### start-frontend 拆解

| 操作 | 路径                                 |
| ---- | ------------------------------------ |
| 删除 | `.claude/commands/start-frontend.md` |
| 新建 | `.claude/commands/start-admin.md`    |
| 新建 | `.claude/commands/start-web.md`      |
| 新建 | `.claude/commands/start-landing.md`  |

### 引用更新

| 文件                                            | 变更                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                     | 常用命令列表 `/start-backend`→`/start-api`，`/start-frontend`→`/start-admin`，新增 `/start-landing` |
| `.claude/skills/init-project/SKILL.md`          | 验证步骤中的命令引用                                                                                |
| `apps/landing/src/components/agent-harness.tsx` | 命令展示列表 `/start-backend`→`/start-api`                                                          |
| `.claude/commands/start-all.md`                 | 新增 Web 和 Landing 的启动块（现同时启动 5 个服务）                                                 |

## 验证

- [x] `start-backend.md` 已删除
- [x] `start-api.md` 已存在
- [x] `start-frontend.md` 已删除
- [x] `start-admin.md`、`start-web.md`、`start-landing.md` 已新建
- [x] 所有引用文件已更新，grep 无残留
