---
name: toggle-app
description: 启用或禁用指定的 app（只影响构建和部署，不删除源码）
---

# /toggle-app — 开关 APP

## Overview

当项目中某些 app（如 `web`、`landing`）暂时不需要时，可以用此技能关闭它。关闭后：

- CI/CD 不再构建和推送该 app 的 Docker 镜像
- 部署时不再拉取和重启该 app 的容器
- **源码保留**（`apps/<app>/` 目录不动），随时可重新启用

## Usage

```bash
/toggle-app <app名> on|off
```

### 示例

```bash
/toggle-app web on       # 启用 web 端
/toggle-app landing off  # 禁用 landing 页
```

### 可选 APP

- `api` — NestJS 后端（不建议关闭）
- `admin` — Refine 管理后台
- `web` — Next.js 用户端
- `landing` — 静态落地页
- `miniapp` — 微信小程序

## 实现说明

此技能调用 `scripts/toggle-app.sh` 脚本，该脚本：

1. 读取 `.scaffold-config.json` 中的 `apps` 列表
2. 添加或移除指定的 app
3. 提示用户提交和推送

`.scaffold-config.json` 提交到 git 仓库，CI/CD 会在每次推送时读取它来决定构建和部署哪些 app。

## 注意事项

- 当前脚手架默认启用 `api admin`，如果你不需要 `miniapp`，可执行 `/toggle-app miniapp off`
- `api` 不建议关闭（其他 app 都依赖它）
- `miniapp` 没有 Dockerfile，关闭它只影响 dev 命令显示，不影响 CI/CD
- 变更需要 `git commit && git push` 后 CI 才会生效
