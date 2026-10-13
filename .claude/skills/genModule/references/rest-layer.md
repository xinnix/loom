# REST Layer Implementation

外部端（Web / 小程序）的 REST API 层。Admin 端走 tRPC，不经过此层（R4 双协议边界）。

**Note:** genModule 已自动生成标准 REST Controller（外部端模块缺省生成，`--no-rest` 跳过）。本文档是生成产物的契约说明，也是手写/定制 REST 层时的参考。

## Controller 契约（以实际实现为准）

**Location:** `apps/api/src/modules/[module]/rest/[camel].controller.ts`

真实依赖路径与模式（与早期 Swagger/DTO 方案不同，以仓库实际为准）：

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../modules/auth/decorators/decorators';

@Controller('[module_plural]')
export class [Module]Controller {
  constructor(private readonly prisma: PrismaService) {}

  // 每个端点：@UseGuards(JwtAuthGuard) + @CurrentUser() 注入 userId
  // 数据隔离（R5）：所有查询 where: { ..., userId: currentUser.id }
}
```

**五端点：**

| 方法   | 路径                | 入参                                             | 说明                       |
| ------ | ------------------- | ------------------------------------------------ | -------------------------- |
| GET    | `/api/[plural]`     | query: page/pageSize/search + enum/bool/num 筛选 | 分页列表（createdAt 倒序） |
| GET    | `/api/[plural]/:id` | param id                                         | 单条详情                   |
| POST   | `/api/[plural]`     | body 字段 + 自动注入 userId                      | 创建                       |
| PUT    | `/api/[plural]/:id` | param id + body（date 字段转 `new Date()`）      | 更新                       |
| DELETE | `/api/[plural]/:id` | param id                                         | 删除                       |

**要点：**

- **无 Swagger、无 DTO class、无 Zod 校验**——校验在 tRPC 层（Admin），REST 层保持轻量（如需 REST 层校验属 E6 演进）
- **直注 PrismaService**，不经过 Service 层（与 Todo 参考实现一致；Service 化属 E6）
- 资源不存在时返回 `{ success: false, data: null, message: '...' }`（HTTP 200），客户端靠 data/message 判断

## 响应格式（TransformInterceptor 统一包装）

全局 `TransformInterceptor`（`core/interceptors/transform.interceptor.ts`）会重组 Controller 返回值——**分页字段必须顶层扁平返回**（不要嵌套 meta 对象，会被丢弃）：

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": { "...": "..." },
  "timestamp": "2026-10-13T09:00:00.000Z",
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

列表端点 Controller 应返回：

```typescript
return {
  success: true,
  data: items,
  total,
  page: p,
  pageSize: ps,
  totalPages: Math.ceil(total / ps),
};
```

## 模块注册

**Location:** `apps/api/src/modules/[module]/module.ts`（genModule 双版：有 REST 时注册 controller，否则空壳）

```typescript
import { [Module]Controller } from './rest/[camel].controller';
import { Module } from '@nestjs/common';

@Module({
  controllers: [[Module]Controller],
  providers: [],
  exports: [],
})
export class [Module]Module {}
```

再注册到 `apps/api/src/app.module.ts` 的 imports。

## Web 端消费

`apps/web/src/lib/api-client.ts` 提供 `apiClient.get/post/put/delete`（Bearer 注入 + 401 刷新互斥锁 + `ApiResponse<T>` 扁平信封）。genModule 生成的 per-module client 在 `apps/web/src/lib/api/[camel].ts`（wire 类型 + 枚举字典 + `xxxApi`），页面手写时直接 import。

小程序端走 `apps/miniapp/src/utils/http.ts`（`http.get<T>` 的 T 为 data payload，信封由 `Response<T>` 提供；勿二次包装）。

## Testing Endpoints

```bash
# 登录（User 账号，REST 只服务外部端用户）
TOKEN=$(curl -s http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"password123"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])")

# 列表（分页 + 搜索 + 筛选）
curl "http://localhost:3000/api/[module_plural]?page=1&pageSize=10&search=kw" -H "Authorization: Bearer $TOKEN"

# 详情 / 创建 / 更新 / 删除
curl "http://localhost:3000/api/[module_plural]/<id>" -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/api/[module_plural] -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Example","status":"active"}'
curl -X PUT http://localhost:3000/api/[module_plural]/<id> -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Updated"}'
curl -X DELETE http://localhost:3000/api/[module_plural]/<id> -H "Authorization: Bearer $TOKEN"

# 无 token 应返回 401
curl -o /dev/null -w "%{http_code}" http://localhost:3000/api/[module_plural]
```
