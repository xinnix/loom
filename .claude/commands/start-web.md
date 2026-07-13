---
description: 启动 Web 用户端（Next.js 15 + SSR + REST）
---

启动 Web 用户端开发服务器，使用 Monitor 工具实时监控日志。

启动命令：

```typescript
Monitor({
  command: 'cd apps/web && pnpm dev',
  description: 'Web 用户端监控（Next.js SSR）',
  persistent: true,
  timeout_ms: 3600000,
});
```

服务地址：

- Web 用户端: http://localhost:3002

停止服务：
使用 `/tasks` 命令查看运行中的任务 ID，然后使用 TaskStop 工具停止服务。
