# AGENTS.md - Loom Monorepo 脚手架指南

## 🎯 脚手架定位

**开箱即用的全栈管理系统脚手架**，基于 Agent-Centric 开发模式。

### 核心特性

- ✅ 完整的 RBAC 权限系统（Admin 端）
- ✅ 双用户认证体系（Admin + User）
- ✅ 开箱即用的 CRUD 模板生成
- ✅ 端到端类型安全（tRPC）
- ✅ 多端支持（Admin 后台 + 小程序）
- ✅ Monorepo 统一管理

### 适用场景

- 企业管理后台
- SaaS 多租户系统
- 小程序 + 管理后台组合
- 快速原型开发

---

## 🛠 技术栈

| 端           | 技术栈                                       |
| ------------ | -------------------------------------------- |
| **Backend**  | NestJS + tRPC + Prisma + PostgreSQL          |
| **Admin UI** | React 18 + Refine + Ant Design + tRPC Client |
| **Miniapp**  | uni-app + Vue 3 + TypeScript                 |
| **Monorepo** | pnpm Workspace + Turborepo                   |

---

## 🏗 Monorepo 规范

### 依赖规则

- `apps/*` 引用 `infra/*` 必须使用 `workspace:*` 协议
- `infra/` 包严禁引用 `apps/` 内容
- 通用工具优先在根目录或 `infra/shared` 统一管理

### 目录职责

```
apps/
├── api/          # NestJS 后端，业务逻辑在 *.service.ts
├── admin/        # Refine 前端，tRPC 强类型调用
└── miniapp/      # uni-app 小程序，RESTful API
infra/
├── database/     # Prisma Schema + Client
└── shared/       # Zod Schema + 类型定义
```

---

## 💻 快速命令

### 基础操作

```bash
pnpm install                    # 安装依赖
pnpm dev                        # 启动全部服务（API + Admin + Miniapp）
pnpm build                      # 构建全部项目
```

### 单独启动

```bash
pnpm --filter @loom/api dev       # 后端
pnpm --filter @loom/admin dev     # Admin 前端
pnpm --filter @loom/miniapp dev   # 小程序 H5
pnpm --filter @loom/miniapp dev:mp-weixin  # 微信小程序
```

### 数据库操作

```bash
pnpm --filter @loom/database prisma generate   # 生成 Client
pnpm --filter @loom/database prisma migrate dev # 运行迁移
pnpm --filter @loom/database prisma db seed     # 执行 Seed（推荐使用 /seed-data）
```

**⚠️ 重要：Prisma Seed 问题解决方案**

由于 Prisma 7.x 和某些 adapter 配置存在兼容性问题，**推荐使用 SQL 脚本直接创建假数据**：

1. 使用 `/seed-data` command 快速创建假数据（推荐）
2. 或手动执行 SQL 脚本：

   ```bash
   # 基础数据（用户、角色、权限）
   docker exec -i postgres psql -U xinnix -d loom < infra/database/prisma/seed-base.sql

   # 业务数据（商户、券模板、订单等）
   docker exec -i postgres psql -U xinnix -d loom < infra/database/prisma/seed-data.sql
   ```

**Seed 脚本位置：**

- `infra/database/prisma/seed-base.sql` - 基础数据（Admin、User、Role、Permission、Todo）
- `infra/database/prisma/seed-data.sql` - 业务数据（Merchant、CouponTemplate、Order、News、Settlement）

**测试账号：**

- 管理端：superadmin@example.com / password123
- 小程序：user@example.com / password123

````

---

## ✍️ 核心规范

### 1. 编码风格

**后端 CRUD 模式：**
```typescript
// 必须继承 BaseService
export class ProductService extends BaseService<Product> {
  constructor(prisma: PrismaService) {
    super(prisma, "product");
  }
}
````

**命名规范：**

- 文件：`feature-name.service.ts`（小写横杠）
- TS 变量：`camelCase`
- 数据库字段：`snake_case`
- tRPC 路由：与 Prisma 模型名对齐

**SSOT 原则：**

- `schema.prisma` 是唯一的模型真理源
- `infra/shared` 是唯一的验证真理源
- 所有端共享 `@loom/shared` 类型

### 2. 双用户认证体系

**Admin 用户（管理后台）：**

- 表：`admins`
- 权限：RBAC 角色-权限系统
- Token：`{ sub, email, type: 'admin' }`

**User 用户（小程序）：**

- 表：`users`
- 登录：微信登录 / 邮箱注册
- Token：`{ sub, email, type: 'user' }`

**关键约束：**

- ⚠️ JWT Strategy 自动识别用户类型
- ⚠️ 小程序用户无权访问管理端路由
- ⚠️ Token 必须包含 `type` 字段

### 3. 数据隔离原则

- Admin 用户可访问所有数据
- User 用户只能访问自己的数据（`where: { userId: user.id }`）
- 创建时自动注入当前用户 ID

### 4. 小程序规范

- 统一使用 `src/utils/http.ts` HTTP 客户端
- API 端点在 `src/config/api.ts` 统一管理
- 每个模块独立 API 文件 `src/api/*.ts`
- 详细规范见：`docs/miniapp-architecture.md`

---

## 📝 工作流程

### 开发前必读

1. 阅读 `docs/product/vision.md` 了解产品愿景
2. 阅读对应 `docs/prd/*.md` 了解需求
3. 使用 `/genModule <name>` 生成模块骨架

### 开发后必做

1. 更新 `docs/product/roadmap.md` 进度

---

## 🤖 Agent Skills

### 模块生成

- `/genModule <name>` - 生成完整 CRUD 模块（Schema → Service → Router → UI）

### 开发辅助

- `/sync` - 同步工作区
- `/db-migrate` - 数据库迁移
- `/build-all` - 构建全部
- `/start-all` - 启动全部服务
- `/start-mini` - 启动小程序

### 代码质量

- `/simplify` - 简化代码，提升复用性
- `/type-check` - TypeScript 类型检查

---

## 📚 参考文档

- **产品愿景**：`docs/product/vision.md`
- **需求文档**：`docs/prd/*.md`
- **开发路线**：`docs/product/roadmap.md`
