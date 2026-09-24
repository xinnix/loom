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

API 服务提供健康检查端点：

```bash
curl http://localhost:3000/health
```

Docker Compose 配置：

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  retries: 3
```

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
