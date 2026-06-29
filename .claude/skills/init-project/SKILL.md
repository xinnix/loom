---
name: init-project
description: 交互式初始化新项目 — 运行替换脚本把脚手架身份标识（包名、数据库名、容器名、管理端标题、品牌文案、域名）一键改成新项目名称，然后重建与验证。
---

# /init-project — 项目初始化

## Overview

把 OpenCode Scaffold 初始化成一个全新的项目。核心是一个可重复运行的替换脚本 `scripts/init-project.sh`，负责**机械、可穷举的全局替换**；本技能负责收集输入、调用脚本、补脚本覆盖不到的文案、重建并验证。

替换目标（脚手架默认 token → 新项目）：

| 维度             | 脚手架 token                  | 新项目                      |
| ---------------- | ----------------------------- | --------------------------- |
| 包 scope         | `@opencode/*`                 | `@<前缀>/*`                 |
| 顶层包名         | `opencode-scaffold`           | `<项目名>`                  |
| 数据库名         | `opencode`                    | `<数据库名>`                |
| 容器/镜像默认    | `${PROJECT_NAME:-opencode}`   | `${PROJECT_NAME:-<项目名>}` |
| UI 品牌文案      | `OpenCode`                    | `<品牌名>`                  |
| miniapp 生产域名 | `https://api.example.com/api` | `<生产API域名>`             |

## Instructions

### Step 0: 前置提醒

此操作不可逆。先确认已 `git commit` 或备份当前状态，便于回滚（`git checkout .` 可恢复已跟踪文件）。

### Step 1: 收集信息

用 AskUserQuestion 或直接询问用户以下信息（缺省均从项目名派生）：

1. **项目名**（必填，如 `my-app`）— 顶层 `package.json` name 与容器默认 `PROJECT_NAME`
2. **包名前缀**（默认 = 项目名，如 `mycompany`，脚本会自动加 `@`）— workspace scope
3. **数据库名**（默认 = 项目名，如 `my_app_db`）— PostgreSQL 库名
4. **品牌名**（默认 = 项目名，如 `我的应用`）— 管理/Web/Landing 端可见的标题与文案
5. **生产 API 域名**（可选，如 `https://api.myapp.com/api`）— miniapp 生产环境地址，不提供则保留占位

### Step 2: 运行替换脚本

```bash
bash scripts/init-project.sh "<项目名>" "<包名前缀>" "<数据库名>" "<品牌名>" "<生产API域名>"
```

示例：

```bash
bash scripts/init-project.sh my-app mycompany my_app_db "我的应用" "https://api.myapp.com/api"
```

脚本会逐项打印影响文件数，并在结尾做残留检查。**脚本刻意不触碰**：

- `.claude/skills/init-project/` 自身（避免自毁，保证可重复运行）
- `schema.prisma`、prisma 迁移（数据库结构由 `db-migrate` 技能负责）
- 本机个人配置 `.claude/settings.local.json`
- 技能脚本里硬编码的 Claude 内存路径（含本机绝对路径，不在通用替换范围）

### Step 3: 脚本覆盖不到、需手动确认的点

逐项核对，按需手动处理：

- **本地 `.env`**：若用户已从 `.env.example` 复制出 `.env`，脚本不会改它（`.env` 被排除）。提示用户把 `DATABASE_URL` 的库名手动改成新值。
- **README 溯源**：`README.md` / `README.en.md` 里的 `git clone .../opencode-scaffold.git` 是脚手架获取说明，默认保留。若用户希望 README 完全项目化，可手动替换其中的 `opencode-scaffold` 为新仓库名。
- **CLAUDE.md / AGENTS.md**：这些是脚手架文档，标题 `OpenCode Scaffold` 默认保留为脚手架出处说明；其中的数据库名示例已在脚手架归一化阶段统一为 `opencode`，无需改。
- **微信小程序 appId / 支付商户号**：需在新项目中单独申请，填入 `.env`，不在本技能范围。

### Step 4: 重新安装与重建

```bash
pnpm install        # 更新 workspace 包名链接
/sync               # Prisma Generate + Build Shared（@<前缀>/shared）
```

### Step 5: 初始化数据库

```bash
# 启动本地 PostgreSQL（库名为步骤 1 设置的值）
docker compose -f docker-compose.local.yml up -d   # 若用容器化数据库
# 或确保 .env 的 DATABASE_URL 指向新库名

/db-migrate         # 建库 + 迁移 + 生成 Prisma Client + Seed
```

### Step 6: 验证

```bash
/start-backend
/start-frontend
```

确认：

- 管理端标题已变为新品牌名（`apps/admin/index.html`）
- 登录、CRUD 正常
- 容器名 / 数据库连接使用新项目名

## 注意事项

- **幂等可重复**：脚本找不到源 token 时为 no-op，重复运行不会叠加破坏。若需换一套名称，先 `git checkout .` 回到脚手架状态再重跑。
- **范围边界**：本技能只替换"身份标识"。`coupon` / `merchant` 等是脚手架自带的 demo 业务模型，如需清空请用 `/scaffold-clean` 技能。
- `infra/shared` 构建产物（`.d.ts`）会随 `/sync` 重新生成，无需手动清理。
- 小程序的 `appId` 等微信配置需要在新项目中单独申请。
