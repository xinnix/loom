<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Node-%3E%3D18-green.svg" alt="Node">
  <img src="https://img.shields.io/badge/pnpm-10.12-orange.svg" alt="pnpm">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<h1 align="center">Loom</h1>

<p align="center">
  <strong>Agent-Centric 全栈管理系统脚手架</strong><br>
  让 Claude Code 写代码，人类做决策
</p>

<p align="center">
  <code>npx @xinnix/create-loom my-project</code> &nbsp;→&nbsp; 一个全栈管理系统，3 分钟开箱即用
</p>

<p align="center">
  NestJS + tRPC + Prisma + PostgreSQL · React + Refine + Ant Design<br>
  内置 RBAC / 双身份认证 / 微信支付 / 文件上传 / AI Agent
</p>

---

## 目录

- [快速开始](#快速开始)
- [架构概览](#架构概览)
- [Claude Code 技能清单](#claude-code-技能清单)
- [开发工作流示例](#开发工作流示例)
- [核心抽象层](#核心抽象层)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [内置模块](#内置模块)
- [终端命令参考](#终端命令参考)
- [环境变量](#环境变量)
- [部署](#部署)

---

## 快速开始

### 方式一：从模板创建新项目（推荐）

```bash
npx @xinnix/create-loom my-app
```

命令将：

1. 交互式询问项目名称、包 scope、数据库名、品牌名
2. 从 GitHub 克隆脚手架模板
3. 自动替换全部身份标识（包名、数据库、容器名、品牌文案、API 域名）
4. 执行 `pnpm install` 安装依赖
5. 初始化 git 仓库

完成后进入项目：

```bash
cd my-app
cp .env.example .env                 # 编辑配置
docker compose -f docker-compose.local.yml up -d   # 启动 PostgreSQL
pnpm exec prisma migrate dev         # 建库 + 迁移
pnpm exec prisma db seed             # 填充测试数据
pnpm dev                             # 启动全部服务
```

| 服务              | 地址                    | 测试账号                               |
| ----------------- | ----------------------- | -------------------------------------- |
| API (tRPC + REST) | `http://localhost:3000` | —                                      |
| Admin 管理后台    | `http://localhost:5173` | `superadmin@example.com / password123` |
| Web 用户端        | `http://localhost:3002` | `user@example.com / password123`       |
| Landing 落地页    | `http://localhost:3001` | —                                      |
| Miniapp H5        | `http://localhost:8080` | `user@example.com / password123`       |

#### 高级选项

```bash
npx @xinnix/create-loom my-app --yes             # 跳过所有交互，使用默认值
npx @xinnix/create-loom my-app --scope myco --db myco_db --brand MyCo   # 自定义标识
npx @xinnix/create-loom my-app --apps api,admin,web,landing,miniapp     # 选择要保留的模块
npx @xinnix/create-loom my-app --api-domain https://api.myapp.com       # 设置生产 API 域名
```

### 方式二：初始化已有克隆

```bash
git clone <repo-url> my-project
cd my-project
/init-project           # Claude Code 交互式初始化（替换包名、数据库名等）
/scaffold-clean         # （可选）移除示例模块，生成纯净空白项目
pnpm install
# 启动服务同上
```

### 启动单个服务

```bash
/start-api        # API 服务（NestJS + tRPC）→ localhost:3000
/start-admin      # 管理后台 → localhost:5173
/start-web        # Web 用户端 → localhost:3002
/start-landing    # 落地页 → localhost:3001
/start-mini       # 小程序 H5 → localhost:8080
```

---

## 架构概览

```
                  ┌─────────────────────────────────────────────────────┐
                  │            apps/admin (React 19 + Refine)           │
                  │  StandardListPage / StandardForm / StandardDetail   │
                  └──────────────────────┬──────────────────────────────┘
                                         │ tRPC Client (端到端类型安全)
                  ┌──────────────────────┴──────────────────────────────┐
                  │            apps/api (NestJS)                         │
                  │  tRPC Router / BaseService / RBAC Guards            │
                  │  Auth / WeChat / Payment / Upload / Dify Agent      │
                  └──────┬──────────────────────────────────┬───────────┘
                         │ Prisma ORM                        │ External
              ┌──────────┴──────────┐              ┌────────┴──────────┐
              │ PostgreSQL          │              │ WeChat Pay / OSS  │
              │ (唯一数据源)         │              │ / Dify AI         │
              └─────────────────────┘              └───────────────────┘

                  ┌─────────────────────────────────────────────────────┐
                  │    apps/web (Next.js SSR)   apps/miniapp (uni-app)  │
                  │    REST API + httpOnly Cookie / 本地存储 Token       │
                  └─────────────────────────────────────────────────────┘
```

**类型安全链路：**

```
schema.prisma ──► Prisma Client ──► AppRouter ──► @loom/shared ──► tRPC Client
     (SSOT)        (@loom/db)     (tRPC)       (Zod Schema)       (Admin/Miniapp)
```

**双身份模型：**

| 身份  | 通信协议 | 权限范围         | Token 存储                 |
| ----- | -------- | ---------------- | -------------------------- |
| Admin | tRPC     | RBAC（全部数据） | 内存                       |
| User  | REST     | 仅自己的数据     | httpOnly Cookie / 本地存储 |

JWT `type` 字段在网关层自动隔离跨身份访问。更多详见 [Auth 模块文档](docs/auth.md)。

---

## Claude Code 技能清单

本项目深度集成 [Claude Code](https://claude.ai/code) 作为主要开发工具。所有技能通过斜杠命令在 Claude Code 中调用。

### 核心开发技能

| 命令                   | 作用                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| `/genModule <name>`    | **生成全栈 CRUD** — Prisma → tRPC → 前端 → 小程序                      |
| `/analyze`             | **分析现有模块** — 提取模式、指出标准化机会                            |
| `/refactor`            | **重构为标准模式** — BaseService + createCrudRouter + StandardListPage |
| `/deleteModule <name>` | **删除模块** — 清理前后端代码 + Schema                                 |

### 数据与 Schema 技能

| 命令          | 作用                                                        |
| ------------- | ----------------------------------------------------------- |
| `/db-migrate` | **数据库迁移** — 生成迁移 SQL + 应用 + Prisma Client + Seed |
| `/sync`       | **同步工作区** — Prisma Generate + 构建 @loom/shared        |
| `/enum-sync`  | **枚举同步** — Prisma enum → Zod enum → 前端 Select options |
| `/seed-data`  | **生成假数据** — 快速填充开发和测试数据                     |

### 项目生命周期技能

| 命令                        | 作用                                                 |
| --------------------------- | ---------------------------------------------------- |
| `/init-project`             | **初始化项目** — 替换全部脚手架身份标识为新项目名称  |
| `/scaffold-clean`           | **清理示例** — 移除 todo 示例，生成纯净空白项目      |
| `/toggle-app <app> on\|off` | **开关应用模块** — 控制构建和部署，不删除源码        |
| `/validate`                 | **全栈验证** — 依次运行类型检查 + lint + 构建 + 测试 |
| `/type-check`               | **类型检查** — 全仓库 TypeScript 类型检查            |
| `/build-all`                | **构建全部** — 构建整个 monorepo                     |
| `/ship`                     | **分批提交** — 按变更类型分组提交并推送              |

### 任务管理技能

| 命令    | 作用                                                        |
| ------- | ----------------------------------------------------------- |
| `/task` | **任务追踪** — 创建/查看/管理开发任务，支持跨会话上下文恢复 |

### 设计技能

| 命令               | 作用                                          |
| ------------------ | --------------------------------------------- |
| `/frontend-design` | **前端设计** — 构建高质量 UI 组件，避免通用感 |

### PRD 执行

| 命令        | 作用                                                  |
| ----------- | ----------------------------------------------------- |
| `/prd-exec` | **PRD 落地** — 将产品需求文档拆解为可执行任务逐步完成 |

---

## 开发工作流示例

### 1. 新功能开发

```bash
# 在 Claude Code 中：
/task                     # 创建任务追踪（可选）
/genModule product        # 生成商品管理全栈模块
# 回到终端：
/db-migrate               # 应用数据库迁移
/start-api                # 启动后端验证
# 在 Claude Code 中：
/task                     # 标记完成
/ship                     # 分批提交推送
```

### 2. Schema 变更

```bash
# 手动修改 infra/database/prisma/schema.prisma
/db-migrate         # 生成迁移 → 应用 → 生成 Prisma Client → Seed
/sync               # 重新构建 @loom/shared（Zod Schema 对齐）
/type-check         # 验证类型一致性
/ship               # 提交推送（CI 自动部署迁移）
```

### 3. 从 PRD 到上线

```bash
# 在 Claude Code 中：
/prd-exec           # 输入 PRD 文档，自动拆解为任务列表并逐步执行
# 按拆解结果的依赖顺序逐个完成任务
# 每个模块完成后：
/ship               # 分批提交
```

### 4. 分析重构

```bash
/analyze            # 分析现有模块，生成标准化建议
/refactor           # 一键重构为 BaseService + StandardListPage 模式
/validate           # 全栈验证确保无破坏性变更
```

### 5. 初始化新项目

```bash
# 终端：
npx @xinnix/create-loom my-app     # 从模板创建
cd my-app
/init-project                       # 替换脚手架标识
/scaffold-clean                     # （可选）移除示例模块
docker compose -f docker-compose.local.yml up -d
/db-migrate                         # 建库
/start-all                          # 启动全部服务
```

---

## 核心抽象层

### BaseService — CRUD 基类

继承即用，内置全部 CRUD 方法 + 生命周期钩子 + 行级权限：

```typescript
@Injectable()
export class ProductService extends BaseService<'Product'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Product');
  }
  // 可用方法: list, getOne, create, update, remove, removeMany, count, exists
  // 生命周期钩子: beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
  // 行级权限: checkOwnership(userId, recordId)
}
```

### createCrudRouter — tRPC 路由工厂

一行代码生成 6 个 tRPC Procedure + 搜索 + 过滤 + 分页：

```typescript
export const productRouter = createCrudRouter(
  'Product',
  { create: CreateProductSchema, update: UpdateProductSchema },
  { searchFields: ['name', 'description'], protectedGetMany: true },
);
// 自动生成: getMany (搜索+过滤), getOne, create, update, delete, deleteMany
```

### 声明式前端三件套

| 组件                 | 用途          | 文件位置                                               |
| -------------------- | ------------- | ------------------------------------------------------ |
| `StandardListPage`   | 数据列表页    | `apps/admin/src/shared/components/StandardListPage/`   |
| `StandardForm`       | 创建/编辑表单 | `apps/admin/src/shared/components/StandardForm/`       |
| `StandardDetailPage` | 数据详情页    | `apps/admin/src/shared/components/StandardDetailPage/` |

```tsx
// 列表页 — 配置驱动，无需手写表格
<StandardListPage
  resource="products"
  title="商品管理"
  columns={columns}
  searchFields={[{ field: 'name', placeholder: '搜索商品名' }]}
  formComponent={ProductForm}
/>;

// 表单字段 — 声明式定义，自动推断验证
const fields: FieldDefinition[] = [
  { key: 'name', label: '商品名', type: 'input', required: true },
  { key: 'price', label: '价格', type: 'number', min: 0, precision: 2 },
  { key: 'categoryId', label: '分类', type: 'select', resource: 'categories' },
  { key: 'cover', label: '封面图', type: 'upload', maxFileSize: 2 },
  { key: 'isActive', label: '上架', type: 'switch' },
];
```

### `/genModule` 智能字段推断

```bash
/genModule product    # 一行命令生成全栈 CRUD
```

基于字段名自动推断 UI 组件：

| 字段模式            | 推断组件                         |
| ------------------- | -------------------------------- |
| `price`, `amount`   | InputNumber + ¥ 格式化 + min:0   |
| `email`             | email 验证规则                   |
| `phone`             | 手机号正则验证                   |
| `avatar`, `cover`   | OSSUpload 图片上传               |
| `*Id`（外键）       | Select 选项（自动关联 resource） |
| `parentId`          | TreeSelect（自动检测树形结构）   |
| `is*`（以 is 开头） | Switch 开关                      |
| `*At`（以 At 结尾） | DatePicker + showTime            |

**生成产物：**

| 目标           | 路径                                                      |
| -------------- | --------------------------------------------------------- |
| Prisma Model   | `infra/database/prisma/schema.prisma`（追加）             |
| tRPC Router    | `apps/api/src/modules/<name>/trpc/<name>.router.ts`       |
| NestJS Module  | `apps/api/src/modules/<name>/module.ts`                   |
| List Page      | `apps/admin/src/modules/<name>/pages/<Name>ListPage.tsx`  |
| Form Component | `apps/admin/src/modules/<name>/components/<Name>Form.tsx` |
| Miniapp API    | `apps/miniapp/src/api/<name>.ts`                          |
| 自动注册       | `app.router.ts` + `App.tsx` + `AdminLayout.tsx` 自动追加  |

---

## 技术栈

| 层           | 技术                                | 职责                       |
| ------------ | ----------------------------------- | -------------------------- |
| **Backend**  | NestJS + tRPC + Prisma + PostgreSQL | API + 类型安全 RPC + ORM   |
| **Admin UI** | React 19 + Refine + Ant Design 5    | 管理后台                   |
| **Web**      | Next.js 15 + Tailwind CSS v4 + REST | 用户端 Web 应用            |
| **Landing**  | Next.js 15 + Tailwind CSS v4 (SSG)  | 落地页 / 营销站            |
| **Miniapp**  | uni-app + Vue 3 + TypeScript        | 微信小程序                 |
| **Shared**   | Zod + `@loom/shared`                | 验证 Schema + 类型注册中心 |
| **Monorepo** | pnpm 10.12 Workspace                | 统一管理                   |
| **Dev**      | Claude Code + Husky + Commitlint    | AI 辅助 + 代码规范         |

---

## 目录结构

```
loom/
├── apps/
│   ├── api/                    # NestJS 后端
│   │   └── src/
│   │       ├── modules/        # 业务模块（按 domain 拆分）
│   │       ├── trpc/           # tRPC 配置 + AppRouter + createCrudRouter 工厂
│   │       ├── common/         # BaseService 基类 + BusinessException
│   │       └── core/           # Guards, Filters, Interceptors
│   ├── admin/                  # React + Refine 管理后台
│   │   └── src/
│   │       ├── modules/        # 业务页面（按 module 拆分）
│   │       └── shared/         # StandardListPage + StandardForm + dataProvider
│   ├── web/                    # Next.js 用户端（SSR）
│   ├── landing/                # Next.js 落地页（SSG 静态导出）
│   └── miniapp/                # uni-app 微信小程序
├── infra/
│   ├── database/               # Prisma Schema + Client + Seed + Migrations
│   └── shared/                 # @loom/shared（Zod Schema + 类型定义）
├── packages/
│   └── create-loom/            # npx 脚手架安装包
├── .claude/                    # Claude Code 技能 + Agent + 命令配置
│   ├── skills/                 # 18 个 AI 技能（genModule, analyze, ship 等）
│   ├── agents/                 # 专用 Agent 定义
│   └── commands/               # 斜杠命令定义
├── docs/                       # 技术文档
└── CLAUDE.md                   # Claude Code 项目配置（编码规范 + 开发流程）
```

---

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

---

## 终端命令参考

```bash
pnpm dev          # 启动全部服务（API + Admin + Miniapp）
pnpm dev:api      # 仅启动后端 API
pnpm dev:admin    # 仅启动管理后台
pnpm dev:web      # 仅启动 Web 用户端
pnpm type-check   # 全仓库 TypeScript 类型检查
pnpm lint         # ESLint 代码质量检查
pnpm test         # 运行测试
pnpm build        # 构建整个 monorepo
pnpm format       # Prettier 代码格式化
```

---

## 环境变量

| 变量                     | 必需 | 默认值           | 说明                      |
| ------------------------ | ---- | ---------------- | ------------------------- |
| `DATABASE_URL`           | Yes  | —                | PostgreSQL 连接字符串     |
| `JWT_SECRET`             | Yes  | —                | JWT 签名密钥（≥32 chars） |
| `JWT_EXPIRES_IN`         | No   | `7d`             | Access Token 过期时间     |
| `JWT_REFRESH_EXPIRES_IN` | No   | `30d`            | Refresh Token 过期时间    |
| `CORS_ORIGIN`            | No   | `localhost:5173` | 允许的前端域名            |
| `PORT`                   | No   | `3000`           | API 服务端口              |
| `WX_APP_ID`              | No   | —                | 微信小程序 AppID          |
| `WX_APP_SECRET`          | No   | —                | 微信小程序 AppSecret      |
| `WX_PAY_MCH_ID`          | No   | —                | 微信支付商户号            |

完整配置见 `.env.example`。

---

## 部署

```bash
cp .env.example .env.prod
# 编辑 .env.prod 填写生产配置
docker compose -f docker-compose.prod.yml up -d
```

容器架构：`api`（NestJS）· `admin`（Nginx + 静态文件）· `web`（Next.js SSR）· `landing`（Nginx + 静态文件）· `postgres` · `redis`

**CI/CD 流程：** push 到 `main` 时自动执行 build + type-check + `prisma migrate deploy`（需配置 `PROD_DATABASE_URL` GitHub Secret）。

---

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

**数据隔离：** Admin 可访问全量数据，User 仅能访问自己的数据（`where: { userId: user.id }`），`createdById` / `updatedById` 从 JWT 自动注入。

**管理端页面规范：** 必须使用三大标准模板组件，禁止手写重复 CRUD 页面逻辑：

```tsx
// ✅ 正确：配置驱动
<StandardListPage resource="products" columns={columns} ... />

// ❌ 禁止：手写 Ant Design Table + Form + Drawer
```

---

---

## 赞助支持

用爱发电，不如来爱发电支持我们 ⚡️

<p align="center">
  <a href="https://afdian.com/a/myloom" target="_blank">
    <img src="https://img.shields.io/badge/爱发电-赞助我们-946ce6?style=flat-square" alt="爱发电赞助">
  </a>
  &nbsp;
  <a href="https://afdian.com/a/myloom" target="_blank">https://afdian.com/a/myloom</a>
</p>

## 许可证

[MIT](LICENSE)
