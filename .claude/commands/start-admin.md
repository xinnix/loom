---
description: 启动管理后台（React + Refine + Ant Design）
---

启动管理后台开发服务器，使用 Monitor 工具实时监控日志。

启动命令：

```typescript
Monitor({
  command: 'cd apps/admin && pnpm dev',
  description: '管理后台监控（React + Refine）',
  persistent: true,
  timeout_ms: 3600000,
});
```

服务地址：

- 管理后台: http://localhost:5173（如果端口被占用会自动切换）

停止服务：
使用 `/tasks` 命令查看运行中的任务 ID，然后使用 TaskStop 工具停止服务。
