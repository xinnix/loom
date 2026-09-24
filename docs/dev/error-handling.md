# 错误处理

## 后端错误格式

tRPC 错误统一通过 `TRPCError` 抛出，自动映射为标准 HTTP 状态码：

```typescript
import { TRPCError } from '@trpc/server';

// 业务错误
throw new TRPCError({
  code: 'BAD_REQUEST', // → HTTP 400
  message: '库存不足',
});

// 未找到
throw new TRPCError({
  code: 'NOT_FOUND', // → HTTP 404
  message: '商品不存在',
});

// 未授权
throw new TRPCError({
  code: 'UNAUTHORIZED', // → HTTP 401
  message: 'Token 已过期',
});

// 禁止访问
throw new TRPCError({
  code: 'FORBIDDEN', // → HTTP 403
  message: '权限不足',
});
```

## 前端错误拦截

Refine 的 `useNotification` + tRPC 客户端自动拦截错误并显示通知：

- `4xx` 错误 → `error` 通知（红色）
- `5xx` 错误 → `error` 通知（红色）
- 网络错误 → `error` 通知（红色）

## 错误码映射

| tRPC Code               | HTTP Status | 前端行为       |
| ----------------------- | ----------- | -------------- |
| `BAD_REQUEST`           | 400         | 表单校验提示   |
| `UNAUTHORIZED`          | 401         | 跳转登录页     |
| `FORBIDDEN`             | 403         | 提示权限不足   |
| `NOT_FOUND`             | 404         | 提示资源不存在 |
| `CONFLICT`              | 409         | 提示数据冲突   |
| `INTERNAL_SERVER_ERROR` | 500         | 通用错误提示   |
