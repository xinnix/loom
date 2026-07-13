---
description: 同时启动后端 API、Admin、Web、Landing 和小程序服务
---

同时在后台启动所有开发服务器，使用 Monitor 工具实时监控日志。

启动命令：

**后端 API (NestJS + tRPC)**

```typescript
Monitor({
  command: 'cd apps/api && pnpm dev',
  description: '后端 API 服务监控（NestJS + tRPC）',
  persistent: true,
  timeout_ms: 3600000,
});
```

**管理后台 (React + Refine)**

```typescript
Monitor({
  command: 'cd apps/admin && pnpm dev',
  description: '管理后台监控（React + Refine）',
  persistent: true,
  timeout_ms: 3600000,
});
```

**Web 用户端 (Next.js SSR)**

```typescript
Monitor({
  command: 'cd apps/web && pnpm dev',
  description: 'Web 用户端监控（Next.js SSR）',
  persistent: true,
  timeout_ms: 3600000,
});
```

**营销落地页 (Next.js SSG)**

```typescript
Monitor({
  command: 'cd apps/landing && pnpm dev',
  description: '营销落地页监控（Next.js SSG）',
  persistent: true,
  timeout_ms: 3600000,
});
```

**小程序 (uni-app 微信小程序)**

```typescript
Monitor({
  command: 'cd apps/miniapp && pnpm dev:mp-weixin',
  description: '小程序开发服务监控（微信小程序）',
  persistent: true,
  timeout_ms: 3600000,
});
```

服务地址：

- 后端 tRPC: http://localhost:3000/trpc
- 后端 Swagger: http://localhost:3000/api/docs
- 管理后台: http://localhost:5173（如果端口被占用会自动切换）
- Web 用户端: http://localhost:3002
- Landing 落地页: http://localhost:3001
- 小程序: 在微信开发者工具中打开 `dist/dev/mp-weixin` 目录

停止服务：
使用 `/tasks` 命令查看运行中的任务 ID，然后使用 TaskStop 工具停止对应的服务。
