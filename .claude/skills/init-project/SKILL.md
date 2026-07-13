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
6. **启用 APP**（默认 = `api admin`）— 空格分隔，可选值: `api` `admin` `web` `landing` `miniapp`。不启用的 app 源码保留，但 CI 不会构建和部署它。

### Step 2: 运行替换脚本

先确保已删除原来的 git remote（避免污染脚手架模板仓库）：

```bash
git remote remove origin 2>/dev/null || true
# 确认已删除：
git remote -v    # 应无输出
```

然后运行替换脚本：

```bash
bash scripts/init-project.sh "<项目名>" "<包名前缀>" "<数据库名>" "<品牌名>" "<生产API域名>" "<启用APP列表>"
```

示例：

```bash
bash scripts/init-project.sh my-app mycompany my_app_db "我的应用" "https://api.myapp.com/api" "api admin web"
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
/start-api
/start-admin
```

确认：

- 管理端标题已变为新品牌名（`apps/admin/index.html`）
- 登录、CRUD 正常
- 容器名 / 数据库连接使用新项目名

### Step 7: 创建 GitHub 仓库并推送

在 GitHub 上创建远程仓库，并将初始化后的代码推送上去。

#### 7.1 检查 gh CLI

```bash
gh auth status
```

- 如果提示 `not logged in`，在终端执行（建议输入 `! gh auth login`）：
  ```bash
  gh auth login
  ```
  选择 **GitHub.com** → **HTTPS** → **Login with a web browser**，按提示完成认证。
- 如果提示 `gh: command not found`，先安装：[https://cli.github.com](https://cli.github.com)

#### 7.2 创建仓库并推送

> 替换脚本已在 Step 2 自动移除了旧的 `origin` remote，避免误推到脚手架模板仓库。`gh repo create --push` 会为你创建并设置新的 remote。

确认已 `git commit` 当前状态，然后：

```bash
# 使用项目名创建私有仓库并推送
gh repo create <项目名> --private --push --source=.

# 或者公开仓库
gh repo create <项目名> --public --push --source=.
```

创建后，GitHub Actions CI/CD 会自动触发首次构建。

#### 7.3 确认 CI 已运行

前往 GitHub 仓库的 Actions 标签页，确认：

- ✅ type-check / lint / test 通过
- ✅ build-and-push 成功（Docker 镜像已推送到 GHCR）
- （如果有部署配置）✅ deploy 成功

### Step 8: 部署配置（可选）

推送代码到 GitHub 后，如需自动部署到服务器，完成以下一次性设置。

> **关于启用的 APP**：初始化时已生成 `.scaffold-config.json`，记录了启用的 app 列表。CI/CD 只会构建和部署列表中启用的 app。如需后期调整，编辑 `.scaffold-config.json` 并提交即可。

#### 8.1 在 GitHub Secrets 中配置部署密钥

前往仓库 `Settings → Secrets and variables → Actions`，添加：

| Secret           | 说明                                        |
| ---------------- | ------------------------------------------- |
| `DEPLOY_HOST`    | 服务器 IP 或域名                            |
| `DEPLOY_USER`    | SSH 用户名（如 `root`）                     |
| `DEPLOY_SSH_KEY` | SSH 私钥全文                                |
| `DEPLOY_PATH`    | 服务器上 `docker-compose.prod.yml` 所在目录 |
| `DEPLOY_PORT`    | SSH 端口（可选，默认 `22`）                 |

#### 8.2 生成 SSH 密钥对

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions
ssh-copy-id -i ~/.ssh/github-actions.pub root@<你的服务器IP>
cat ~/.ssh/github-actions          # 复制输出到 GitHub DEPLOY_SSH_KEY
```

#### 8.3 服务器首次部署

```bash
cd /root/opencode
cp .env.prod.example .env.prod     # 填写真实配置
docker login ghcr.io -u <你的GitHub用户名>

# 拉取并启动
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

#### 完整 CI/CD 流程

推送到 `main` 后自动执行：

```
push → type-check → lint → test → migrate → 构建镜像 → 推送 GHCR → SSH 到服务器 → pull → 重启
```

手动回滚：前往 GitHub Actions → "CI / Deploy" → `Run workflow` → 输入目标 TAG。

#### 服务器 `.env.prod` 需要配置的关键变量

```bash
DATABASE_URL=      # PostgreSQL 连接串
JWT_SECRET=        # 生产环境密钥（至少 32 字符）
CORS_ORIGIN=       # 允许的前端域名
WX_APP_ID=         # 微信小程序 AppID
WX_PAY_MCH_ID=     # 微信支付商户号
# ... 其余按需配置
```

## 注意事项

- **幂等可重复**：脚本找不到源 token 时为 no-op，重复运行不会叠加破坏。若需换一套名称，先 `git checkout .` 回到脚手架状态再重跑。
- **范围边界**：本技能只替换"身份标识"。`coupon` / `merchant` 等是脚手架自带的 demo 业务模型，如需清空请用 `/scaffold-clean` 技能。
- `infra/shared` 构建产物（`.d.ts`）会随 `/sync` 重新生成，无需手动清理。
- 小程序的 `appId` 等微信配置需要在新项目中单独申请。
