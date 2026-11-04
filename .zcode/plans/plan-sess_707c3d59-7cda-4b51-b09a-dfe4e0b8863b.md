# Landing 迁移 GitHub Pages 部署方案

## Context

loom 官网（`apps/landing`）此前走独立部署：CI 构建 `Dockerfile.landing`（nginx:alpine 托管静态文件）推 GHCR → SSH 到服务器 `docker compose` 拉起 8080 容器。现改为直接部署到 GitHub Pages 子路径 **https://xinnix.github.io/loom/**（仓库 `xinnix/loom` 为 PUBLIC，Pages 免费可用）。

技术前提已确认：landing 已是 `output: 'export'` 纯静态导出，仅 1 个路由、零 API/env/next-image 依赖，迁移成本低。旧 Docker/nginx 链路彻底移除（用户已拍板）。

## 改动清单

### 1. `apps/landing/next.config.ts` — basePath 环境化

```ts
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
};
```

本地 dev/build 不受影响（根路径），Pages 构建时注入 `/loom`。环境化而非硬编码，保证脚手架 `init-project` 复用到其他仓库名时可配。

### 2. `apps/landing/public/.nojekyll` — 新增空文件

`public/` 内容会拷贝进 `out/`。Actions 部署虽不走 Jekyll，但零成本保险（覆盖将来切分支部署的可能）。

### 3. 新增 `.github/workflows/landing-pages.yml`

官方 Pages 部署模式，安装步骤镜像现有 `ci.yml`（pnpm 10.12.4 / node 22 / cache pnpm）：

- **触发**：push 到 main 且 `paths: [apps/landing/**, .github/workflows/landing-pages.yml]` + `workflow_dispatch`
- **权限**：`contents: read, pages: write, id-token: write`；`concurrency: group pages`
- **步骤**：checkout → pnpm/action-setup@v4 → setup-node@v4 → `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_BASE_PATH=/loom pnpm build:landing` → configure-pages@v5 → upload-pages-artifact@v3（path: `apps/landing/out`）→ deploy-pages@v4

### 4. 移除旧链路（4 处）

- 删除 `Dockerfile.landing`、`nginx.landing.conf`
- `docker-compose.local.yml`：删 landing 服务（53-63 行）
- `docker-compose.prod.yml`：删 landing 服务（78-90 行）
- `.github/workflows/ci.yml`：删 `IMAGE_NAME_LANDING` env（25 行）、`meta-landing` 步骤（194-198）、`Build and push Landing image` 步骤（255-265）、summary 的 Landing 段（359-363）、fallback APPS 列表去掉 `"landing"`（41 行）

> 注：`.scaffold-config.json` 为裸数组 `["api","admin"]`，CI 里 `jq '.apps'` 得 null 的既有怪癖不在本次范围，不动。

### 5. 文档回写

- `docs/ops/deployment.md`：新增 Landing 章节（GitHub Pages 自动部署链路、URL、一次性开启步骤）
- `CHANGELOG.md`：新增 `[0.8.0]` 版本节 —— 「新增」Pages 自动部署 + basePath 支持；「移除」Docker/nginx 旧链路（ADR-010）
- `docs/ROADMAP.md`：回写产物 + 日期

## 验证

1. 本地双构建验证：`pnpm build:landing` → `out/index.html` 资源路径为 `/_next/...`；`NEXT_PUBLIC_BASE_PATH=/loom pnpm build:landing` → 资源路径为 `/loom/_next/...`，且 `out/.nojekyll` 存在
2. 子路径本地预览（可选）：`out/` 拷到 `/tmp/preview/loom/` 后 `npx serve /tmp/preview` 打开 `/loom/` 目检
3. `pnpm type-check` 三端兜底（landing 配置改动理论上不影响类型）
4. 提交推送（`feat(landing): ...` 小写开头）后：
   - 一次性开启：`gh api repos/xinnix/loom/pages -X POST -f build_type=workflow`
   - `gh run watch` 观察 landing-pages workflow → `curl -I https://xinnix.github.io/loom/` 返回 200
