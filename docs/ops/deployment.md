# 部署指南

## Docker 部署（推荐）

### 1. 环境变量

复制 `.env.example` 为 `.env`，修改以下配置：

| 变量                | 说明                     | 必须修改           |
| ------------------- | ------------------------ | ------------------ |
| `JWT_SECRET`        | JWT 签名密钥             | 是                 |
| `CORS_ORIGIN`       | 允许的前端域名           | 是                 |
| `DATABASE_URL`      | PostgreSQL 连接串        | 是                 |
| `WX_PAY_NOTIFY_URL` | 微信支付回调（需 HTTPS） | 是                 |
| `WX_PAY_SANDBOX`    | 支付沙箱模式             | 是（生产设 false） |

### 2. Dockerfile

API 服务使用多阶段构建：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm run build

# 运行阶段
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
```

### 3. 数据库迁移

容器启动时自动执行迁移（通过 entrypoint 脚本）：

```bash
#!/bin/sh
npx prisma migrate deploy
node apps/api/dist/main.js
```

也可手动执行：

```bash
docker exec <container> npx prisma migrate deploy
```

### 4. 健康检查

API 服务当前**没有**专用健康检查路由（如 `/health`）；以「进程有 HTTP 响应」为存活判据（任意状态码含 404 均代表服务已启动）：

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/
```

Docker Compose 配置（示例）：

```yaml
healthcheck:
  test: ['CMD', 'curl', '-s', '-o', '/dev/null', 'http://localhost:3000/']
  interval: 30s
  timeout: 10s
  retries: 3
```

## Landing 官网（GitHub Pages）

官网（`apps/landing`）是纯静态导出（`output: 'export'`，产物 `out/`），自 2026-11 起托管在 GitHub Pages：**https://xinnix.github.io/loom/**，不再产出 Docker 镜像（旧 nginx 容器方案已移除）。

- **自动部署**：`.github/workflows/landing-pages.yml` 在 push main 触及 `apps/landing/**` 或 workflow 自身时构建并发布（也支持手动 `workflow_dispatch`）
- **子路径**：构建时注入 `NEXT_PUBLIC_BASE_PATH=/loom`，由 `apps/landing/next.config.ts` 转为 `basePath`/`assetPrefix`；本地 dev/build 不设此变量即根路径，行为不变
- **一次性开启**：仓库 Settings → Pages → Source 选 "GitHub Actions"，或 `gh api repos/xinnix/loom/pages -X POST -f build_type=workflow`
- **本地验证子路径构建**：`NEXT_PUBLIC_BASE_PATH=/loom pnpm build:landing` 后确认 `out/index.html` 资源引用为 `/loom/_next/...`

## 部署检查清单

### 部署前

- [ ] `.env` 所有生产变量已配置
- [ ] `JWT_SECRET` 已替换为强密钥（≥32 字符）
- [ ] `CORS_ORIGIN` 已指定具体域名
- [ ] 微信小程序 AppID/AppSecret 已配置
- [ ] 微信支付证书已放置到 `apps/api/certs/`
- [ ] OSS Bucket 已创建并配置 CORS
- [ ] 数据库迁移已测试（`prisma migrate dev` 本地验证）

### 部署后

- [ ] 健康检查端点返回 200
- [ ] 管理后台可正常登录
- [ ] 小程序可正常授权登录
- [ ] 文件上传功能正常
- [ ] 微信支付流程可完成

## 常见问题

### Prisma 迁移失败

确认 `DATABASE_URL` 正确且数据库可连接。Docker 中需确保 Prisma CLI 可解析：

```bash
# 检查迁移状态
npx prisma migrate status
# 手动应用迁移
npx prisma migrate deploy
```

### 微信支付回调失败

1. `WX_PAY_NOTIFY_URL` 必须为 HTTPS
2. 服务器可从外网访问
3. 证书文件路径正确
4. API v3 密钥正确
