<h1 align="center">Loom</h1>

<p align="center">
  <strong>Agent-Centric 全栈管理系统脚手架 — 让 Claude Code 写代码，人类做决策</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Node-%3E%3D18-green.svg" alt="Node">
  <img src="https://img.shields.io/badge/pnpm-workspace-orange.svg" alt="pnpm">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome">
</p>

---

克隆即开工。内置 RBAC、双身份认证、微信支付、文件上传，一条命令生成全栈 CRUD 模块。**以 Claude Code 为主要开发者设计** — 人类只需定义业务需求，代码由 Agent 生成。

## 核心价值

| 能力                     | 实现                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **一条命令生成全栈模块** | `/genModule product` → Prisma + tRPC + Service + 前端页面 + 小程序 API             |
| **端到端类型安全**       | `schema.prisma` → Prisma Client → tRPC Router → Zod Schema → 前端，零手写 API 契约 |
| **CRUD 路由工厂**        | `createCrudRouter('Model', schemas)` 一行生成 6 个 procedure + 搜索 + 过滤         |
| **声明式前端**           | `StandardListPage` + `StandardForm` + `FieldDefinition`，配置即页面                |
| **双身份认证**           | Admin (RBAC) + User (微信登录)，JWT `type` claim 自动隔离                          |
| **权限即中间件**         | `permissionProcedure('user', 'create')` 声明式鉴权，super_admin 自动放行           |
| **Token 自动刷新**       | 双端 401→refresh→retry，mutex 防并发                                               |
| **业务友好报错**         | PostgreSQL 约束违例自动翻译为中文用户提示                                          |

## 技术栈

| 层           | 技术                                    | 职责                       |
| ------------ | --------------------------------------- | -------------------------- |
| **Backend**  | NestJS + tRPC + Prisma + PostgreSQL     | API + 类型安全 RPC + ORM   |
| **Admin UI** | React 19 + Refine + Ant Design 5 + tRPC | 管理后台                   |
| **Web**      | Next.js 15 + Tailwind CSS v4 + REST     | 用户端 Web 应用            |
| **Landing**  | Next.js 15 + Tailwind CSS v4 (SSG)      | 落地页 / 营销站            |
| **Miniapp**  | uni-app + Vue 3 + TypeScript            | 微信小程序                 |
| **Shared**   | Zod + `@loom/shared`                    | 验证 Schema + 类型注册中心 |

**类型流：**

```
schema.prisma ──► Prisma Client ──► AppRouter ──► @loom/shared ──► tRPC Client
     (SSOT)        (@loom/db)     (tRPC)       (Zod Schema)       (Admin/Miniapp)
```

## 架构

```
                ┌─────────────────────────────────────────┐
                │            apps/admin (React)            │
                │  StandardListPage / StandardForm / StandardDetailPage / Auth │
                └──────────────────┬──────────────────────┘
                                   │ tRPC Client (type-safe)
                ┌──────────────────┴──────────────────────┐
                │            apps/api (NestJS)             │
                │  tRPC Router / BaseService / Guards     │
                │  Auth / RBAC / Wechat / Payment / Upload│
                └──────┬───────────────────┬──────────────┘
                       │                   │
          ┌────────────┴────────┐   ┌─────┴─────────┐
          │  PostgreSQL (Prisma) │   │ WeChat Pay/OSS│
          └─────────────────────┘   └───────────────┘

                ┌─────────────────────────────────────────┐
                │         apps/miniapp (uni-app)           │
                │  WeChat Login / User Profile / REST API │
                └──────────────────┬──────────────────────┘
                                   │ REST (401→refresh→retry)

                ┌─────────────────────────────────────────┐
                │          apps/web (Next.js SSR)          │
                │  Login / Dashboard / Profile / REST API │
                └──────────────────┬──────────────────────┘
                                   │ REST + httpOnly Cookie
```

**双身份模型**：Admin 通过 tRPC 访问（RBAC 权限），User 通过 REST 访问（仅自己的数据）。JWT `type` 字段在网关层自动隔离跨身份访问。Web 端和 Miniapp 共享 User 身份体系，Token 存储在 httpOnly Cookie（Web）或本地存储（Miniapp）。

## 目录结构

```
loom/
├── apps/
│   ├── api/                    # NestJS 后端
│   │   └── src/
│   │       ├── modules/        # 业务模块 (auth, user, admin, role, payment, upload, wechat, agents)
│   │       ├── trpc/           # tRPC 配置 + AppRouter + createCrudRouter 工厂
│   │       ├── common/         # BaseService 基类 + BusinessException
│   │       └── core/           # Guards, Filters, Interceptors
│   ├── admin/                  # React + Refine 管理后台
│   │   └── src/
│   │       ├── modules/        # 业务页面
│   │       └── shared/        # StandardListPage, StandardForm, StandardDetailPage, dataProvider
│   ├── web/                    # Next.js 用户端 Web 应用（SSR）
│   │   └── src/
│   │       ├── app/            # App Router（login, register, dashboard, profile）
│   │       ├── providers/      # AuthProvider
│   │       └── lib/            # api-client, auth helpers
│   ├── landing/                # Next.js 落地页 / 营销站（SSG 静态导出）
│   └── miniapp/                # uni-app 微信小程序
│       └── src/
│           ├── pages/          # 页面
│           └── api/            # REST API 调用
├── infra/
│   ├── database/               # Prisma Schema + Client + Seed + Migrations
│   └── shared/                 # @loom/shared (Zod Schema + 类型)
├── .claude/                    # Claude Code skills + agents + hooks
└── .env.example                # 环境变量模板
```

## 快速开始

```bash
git clone https://github.com/your-org/loom.git my-project
cd my-project
pnpm install
cp .env.example .env          # 编辑 .env，填写 DATABASE_URL 和 JWT_SECRET
docker compose -f docker-compose.local.yml up -d
cd infra/database && npx prisma migrate dev && npx prisma db seed && cd ../..
pnpm dev
```

| 服务              | 地址                    | 测试账号                               |
| ----------------- | ----------------------- | -------------------------------------- |
| API (tRPC + REST) | `http://localhost:3000` | —                                      |
| Admin             | `http://localhost:5173` | `superadmin@example.com / password123` |
| Web               | `http://localhost:3002` | `user@example.com / password123`       |
| Landing           | `http://localhost:3001` | —                                      |
| Miniapp H5        | `http://localhost:8080` | `user@example.com / password123`       |

## 开发命令

### Claude Code 斜杠命令（推荐）

> 使用 [Claude Code](https://claude.ai/code) CLI，AI 辅助开发

| 命令                   | 用途                                         |
| ---------------------- | -------------------------------------------- |
| `/genModule <name>`    | 交互式全栈 CRUD 模块生成                     |
| `/init-project`        | 初始化新项目（重命名包名、数据库、环境变量） |
| `/analyze`             | 分析现有模块，识别标准化机会                 |
| `/refactor`            | 重构为脚手架标准模式                         |
| `/deleteModule <name>` | 删除模块（清理前后端和 Schema）              |
| `/seed-data`           | 创建假数据                                   |
| `/db-migrate`          | 运行迁移 + 生成 Prisma Client + Seed         |
| `/sync`                | 同步工作区（Prisma Generate + Build Shared） |
| `/enum-sync`           | Prisma enum → Zod enum + 前端 Select options |

### CLI 命令

| 命令              | 用途                |
| ----------------- | ------------------- |
| `pnpm dev`        | 启动全部服务        |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm build`      | 构建整个 monorepo   |

## 核心抽象层

### BaseService — CRUD 基类

```typescript
@Injectable()
export class ProductService extends BaseService<'Product'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Product');
  }
  // 可用: list, getOne, create, update, remove, removeMany, count, exists
  // 钩子: beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
  // 行级权限: checkOwnership(userId, recordId)
}
```

### createCrudRouter — tRPC 路由工厂

```typescript
export const productRouter = createCrudRouter(
  'Product',
  { create: CreateProductSchema, update: UpdateProductSchema },
  { searchFields: ['name', 'description'], protectedGetMany: true, protectedCreate: true },
);
// 生成: getMany (含搜索+过滤), getOne, create, update, delete, deleteMany
```

### StandardListPage + StandardForm + StandardDetailPage — 声明式前端

管理端三大标准模板组件，配置即页面：

| 组件                 | 用途          | 位置                                                   |
| -------------------- | ------------- | ------------------------------------------------------ |
| `StandardListPage`   | 列表页        | `apps/admin/src/shared/components/StandardListPage/`   |
| `StandardForm`       | 创建/编辑表单 | `apps/admin/src/shared/components/StandardForm/`       |
| `StandardDetailPage` | 详情页        | `apps/admin/src/shared/components/StandardDetailPage/` |

```tsx
// 列表页
<StandardListPage
  resource="products"
  title="商品管理"
  columns={columns}
  searchFields={[{ field: 'name', placeholder: '搜索商品名' }]}
  formComponent={ProductForm}
  permissions={{ create: 'product:create', update: 'product:update', delete: 'product:delete' }}
/>;

// 表单字段定义
const fields: FieldDefinition[] = [
  { key: 'name', label: '商品名', type: 'input', required: true },
  { key: 'price', label: '价格', type: 'number', min: 0, precision: 2 },
  { key: 'categoryId', label: '分类', type: 'select', resource: 'categories' },
  { key: 'cover', label: '封面图', type: 'upload', maxFileSize: 2 },
  { key: 'isActive', label: '上架', type: 'switch' },
];

// 详情页
<StandardDetailPage
  resource="products"
  title="商品详情"
  fields={detailFields}
  headerMode="simple"
  tabs={[
    { key: 'basic', label: '基本信息' },
    { key: 'logs', label: '操作日志' },
  ]}
  actions={[{ key: 'edit', label: '编辑', onClick: handleEdit }]}
/>;
```

## genModule 代码生成器

```bash
/genModule product
```

**生成目标：**

| 目标            | 路径                                                        |
| --------------- | ----------------------------------------------------------- |
| Prisma Model    | `infra/database/prisma/schema.prisma`（追加）               |
| tRPC Router     | `apps/api/src/modules/product/trpc/product.router.ts`       |
| NestJS Module   | `apps/api/src/modules/product/module.ts`                    |
| List Page       | `apps/admin/src/modules/product/pages/ProductListPage.tsx`  |
| Form Component  | `apps/admin/src/modules/product/components/ProductForm.tsx` |
| Miniapp API     | `apps/miniapp/src/api/product.ts`                           |
| App Router 注册 | `apps/api/src/trpc/app.router.ts`（追加）                   |
| Refine Resource | `apps/admin/src/App.tsx`（追加）                            |

**智能字段推断：**

| 字段模式          | 推断的 UI 组件                    |
| ----------------- | --------------------------------- |
| `price`, `amount` | InputNumber + ¥ formatter + min:0 |
| `email`           | email 验证规则                    |
| `phone`           | 手机号正则验证                    |
| `avatar`, `cover` | OSSUpload 图片上传                |
| `parentId`        | TreeSelect（自动检测树形结构）    |
| `*Id`（外键）     | Select 下拉（自动关联 resource）  |
| `is*`             | Switch 开关                       |
| `*At`（日期）     | DatePicker + showTime             |

## 编码规范

| 规范        | 示例                                    |
| ----------- | --------------------------------------- |
| 文件命名    | `feature-name.service.ts`（kebab-case） |
| TS 变量     | `camelCase`                             |
| 数据库字段  | `snake_case`（via `@@map`）             |
| Prisma 模型 | `PascalCase`                            |
| tRPC 路由   | 与 Prisma 模型名对齐                    |
| Zod Schema  | `CreateXxxSchema` / `UpdateXxxSchema`   |

**SSOT 原则：** `schema.prisma` 是唯一模型源，`infra/shared` 是唯一验证源，所有端共享 `@loom/shared` 类型。

**数据隔离：** Admin 可访问所有数据，User 只能访问自己的数据（`where: { userId: user.id }`），`createdById` / `updatedById` 从 JWT 自动注入。

## Schema 变更流程

```
修改 schema.prisma → /db-migrate → /sync → git commit & push → CI 自动 migrate deploy
```

## 部署

```bash
cp .env.example .env.prod
# 编辑 .env.prod 填写生产配置
docker compose -f docker-compose.prod.yml up -d
```

容器：`api`（NestJS）、`admin`（Nginx + 静态文件）、`web`（Next.js SSR）、`landing`（Nginx + 静态文件）、`postgres`、`redis`

CI/CD：push 到 `main` 时自动执行 build + type-check + `prisma migrate deploy`（需配置 `PROD_DATABASE_URL` GitHub Secret）

## 环境变量

| 变量                     | 必需 | 默认值           | 说明                       |
| ------------------------ | ---- | ---------------- | -------------------------- |
| `DATABASE_URL`           | Yes  | —                | PostgreSQL 连接字符串      |
| `JWT_SECRET`             | Yes  | —                | JWT 签名密钥（>=32 chars） |
| `JWT_EXPIRES_IN`         | No   | `7d`             | Access Token 过期时间      |
| `JWT_REFRESH_EXPIRES_IN` | No   | `30d`            | Refresh Token 过期时间     |
| `CORS_ORIGIN`            | No   | `localhost:5173` | 允许的前端域名             |
| `PORT`                   | No   | `3000`           | API 服务端口               |
| `WX_APP_ID`              | No   | —                | 微信小程序 AppID           |
| `WX_APP_SECRET`          | No   | —                | 微信小程序 AppSecret       |
| `WX_PAY_MCH_ID`          | No   | —                | 微信支付商户号             |

完整配置见 `.env.example`。

## 内置模块

| 模块       | 后端                                          | 前端                          | 说明                  |
| ---------- | --------------------------------------------- | ----------------------------- | --------------------- |
| auth       | auth.service + auth.router                    | LoginPage + SessionExpired    | 双身份认证 + JWT      |
| user       | user.service + user.router                    | UserListPage + UserDetail     | 小程序用户 CRUD       |
| admin      | admin.service + admin.router                  | AdminListPage + AdminDetail   | 管理员 CRUD + RBAC    |
| role       | role.service + role.router                    | RoleListPage + RoleDetail     | 角色管理 + 权限分配   |
| permission | permission.service + permission.router        | —                             | 权限注册中心          |
| upload     | upload.service + upload.router                | OSSUpload 组件                | 多策略文件存储        |
| payment    | payment.service + payment.router              | —                             | 微信支付 JSAPI + 退款 |
| wechat     | wechat.service                                | —                             | 微信登录 + 小程序 API |
| agents     | agents.service + dify.service + agents.router | AgentListPage + AgentChatPage | Dify AI Agent 对话    |

## 许可证

[MIT](LICENSE)
