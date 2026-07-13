---
description: 启动营销落地页（Next.js 15 + SSG + Tailwind CSS）
---

启动营销落地页开发服务器，使用 Monitor 工具实时监控日志。

启动命令：

```typescript
Monitor({
  command: 'cd apps/landing && pnpm dev',
  description: '营销落地页监控（Next.js SSG）',
  persistent: true,
  timeout_ms: 3600000,
});
```

服务地址：

- Landing 落地页: http://localhost:3001

停止服务：
使用 `/tasks` 命令查看运行中的任务 ID，然后使用 TaskStop 工具停止服务。
