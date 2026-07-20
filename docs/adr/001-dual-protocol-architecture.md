# ADR-001: 双协议架构（Admin 端 tRPC，外部端 REST）

- **日期**：2026-07-20
- **状态**：✅ 已采纳

## 背景

Loom 脚手架需要同时服务两种客户端：

1. **管理后台（Admin）**：React + Refine 前端，需要强类型安全、端到端类型一致性
2. **外部客户端（Web/小程序/Landing）**：Next.js / uni-app / SSG，需要标准 HTTP 协议兼容

初期曾考虑全栈 tRPC，但外部客户端存在以下问题：

- Web 端 Next.js 的 SSR 环境需要复杂的 tRPC 客户端配置
- 小程序 uni-app 无现成 tRPC 客户端支持
- Landing 静态页面不适合 tRPC 的动态查询模式

## 决策

采用双协议架构：

| 层面             | 协议 | 消费者                       | 特点                             |
| ---------------- | ---- | ---------------------------- | -------------------------------- |
| **Admin API**    | tRPC | Admin 前端（React + Refine） | 端到端类型安全，自动生成类型定义 |
| **External API** | REST | Web/小程序/Landing           | 标准 HTTP，语言无关，Cookie 认证 |

## 权衡

### 优点

- Admin 端类型安全：前端直接消费 tRPC Router 类型，无需手写 API 层
- 外部端通用性：REST 兼容任何客户端，降低集成门槛
- 认证边界清晰：tRPC Context 只解析 Admin JWT，REST 中间件处理 Web/小程序 Token
- 可独立演化：双协议的修改互不影响

### 缺点

- 类型定义维护：外部端需要手写 API 响应类型
- 接口不一致：同一功能（如 CRUD）在 Admin 端走 `create/update/getMany`，外部端走 `POST/GET /api/xxx`
- 代码量增加：部分业务逻辑需要同时在 tRPC Router 和 REST Controller 中注册

## 实施要点

- tRPC Context `verifyJwtToken` 只解析 Admin 用户
- Web 端使用 `getTokenFromCookies` 获取 JWT，通过 `/api/trpc` 代理转发
- REST 端点使用 NestJS `@Controller()` + `@Get()`/`@Post()` 装饰器
- genModule 同时生成 tRPC Router 和 REST Controller 模板代码

## 后续考虑

- 如果未来 Web 端也采用 tRPC（如纯客户端渲染场景），可考虑统一协议
- 当前双协议是功能层面的分界，不是服务层面的拆分 — 共享同一 NestJS 应用实例
