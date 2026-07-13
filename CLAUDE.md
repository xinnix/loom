# OpenCode Scaffold — 全栈管理系统脚手架

开箱即用的全栈管理系统脚手架，基于 Agent-Centric 开发模式。克隆即可开工，内置 auth/RBAC/支付/上传等基础设施。

## 核心特性

- RBAC 权限系统（Admin 端）
- 双用户认证体系（Admin + User，支持微信登录）
- 微信支付集成（JSAPI + 退款）
- 开箱即用的 CRUD 模板生成（genModule）
- 端到端类型安全（tRPC）
- 多端支持（Admin 后台 + Web 用户端 + 小程序 + Landing）
- Monorepo 统一管理

## 技术栈

| 端           | 技术栈                                    |
| ------------ | ----------------------------------------- |
| **Backend**  | NestJS + tRPC + Prisma + PostgreSQL       |
| **Admin UI** | React + Refine + Ant Design + tRPC Client |
| **Web**      | Next.js 15 + Tailwind CSS v4 + REST       |
| **Landing**  | Next.js 15 + Tailwind CSS v4 (SSG)        |
| **Miniapp**  | uni-app + Vue 3 + TypeScript              |
| **Monorepo** | pnpm Workspace                            |

## 目录结构

```
apps/
├── api/          # NestJS 后端，业务逻辑在 *.service.ts
├── admin/        # Refine 前端，tRPC 强类型调用
├── web/          # Next.js 用户端 Web 应用（SSR，REST API）
├── landing/      # Next.js 落地页 / 营销站（SSG 静态导出）
└── miniapp/      # uni-app 小程序壳（登录 + 个人中心 + 首页）
infra/
├── database/     # Prisma Schema + Client + Seed
└── shared/       # Zod Schema + 类型定义
docs/             # 技术文档
.claude/          # Claude Code skills/agents/commands
```

## 快速开始

```bash
pnpm install
pnpm dev                        # 启动全部服务（API + Admin + Miniapp）
```

## 常用命令

```bash
# 数据库
/db-migrate                     # 运行迁移 + 生成 Prisma Client + Seed

# 开发
/start-backend                  # 启动后端 API（localhost:3000）
/start-frontend                 # 启动管理后台（localhost:5173）
/start-web                      # 启动 Web 用户端（localhost:3002）
/start-mini                     # 启动小程序 H5
/start-all                      # 同时启动全部服务

# 代码质量
/type-check                     # TypeScript 类型检查
/sync                           # 同步工作区（Prisma Generate + Build Shared）

# 构建
/build-all                      # 构建整个 monorepo
```

## 快速开发命令

| 命令                   | 用途                                         |
| ---------------------- | -------------------------------------------- |
| `/genModule <name>`    | 交互式全栈 CRUD 模块生成                     |
| `/init-project`        | 初始化新项目（重命名包名、数据库、环境变量） |
| `/analyze`             | 分析现有模块，识别标准化机会                 |
| `/refactor`            | 重构现有模块为脚手架标准模式                 |
| `/deleteModule <name>` | 删除模块（清理前后端和 Schema）              |
| `/seed-data`           | 创建假数据                                   |
| `/simplify`            | 简化代码，提升复用性                         |

## 编码规范

### 后端 CRUD 模式

```typescript
// 继承 BaseService
export class ProductService extends BaseService<Product> {
  constructor(prisma: PrismaService) {
    super(prisma, 'product');
  }
}
```

### 命名规范

- 文件：`feature-name.service.ts`（小写横杠）
- TS 变量：`camelCase`
- 数据库字段：`snake_case`
- tRPC 路由：与 Prisma 模型名对齐

### SSOT 原则

- `schema.prisma` 是唯一的模型真理源
- `infra/shared` 是唯一的验证真理源
- 所有端共享 `@roundtable/shared` 类型

## Schema 变更流程

修改 `schema.prisma` 后，必须按以下顺序执行：

```
1. 修改 schema.prisma
2. /db-migrate                    → 生成迁移 SQL + 应用到本地库 + 生成 Prisma Client + Seed
3. /sync                          → 重新构建 @roundtable/shared（Zod Schema 与 Prisma Client 对齐）
4. git add infra/database/prisma/migrations/ && git commit && git push
5. CI 自动 prisma migrate deploy  → 生产数据库同步
```

**关键原则：**

| 原则                | 说明                                                      |
| ------------------- | --------------------------------------------------------- |
| 唯一真理源          | `schema.prisma` 是唯一的模型定义来源                      |
| 禁止 db push 到生产 | `db push` 不生成迁移记录，生产环境必须用 `migrate deploy` |
| 迁移文件必须入库    | 迁移文件提交到 git，CI 才能拿到                           |
| 先本地验证再推送    | `migrate dev` 在本地验证迁移 SQL 正确性，避免生产事故     |

## 双用户认证体系

- **Admin 用户**（管理后台）：RBAC 角色-权限系统，通过 tRPC 通信
- **User 用户**（Web + 小程序）：支持邮箱注册 + 微信登录，通过 REST 通信
- JWT Token 包含 `type` 字段区分用户类型
- Web 端 Token 存储：httpOnly Cookie（SSR 友好，防 XSS）
- 小程序 Token 存储：本地存储（uni.getStorageSync）
- 小程序/Web 用户无权访问管理端路由

## 数据隔离原则

- Admin 用户可访问所有数据
- User 用户只能访问自己的数据（`where: { userId: user.id }`）
- 创建时自动注入当前用户 ID

## Seed 数据

```bash
docker exec -i postgres psql -U xinnix -d opencode < infra/database/prisma/seed-base.sql
```

测试账号：

- 管理端：`superadmin@example.com / password123`
- 小程序：`user@example.com / password123`

## 脚手架抽象层

- `BaseService` — 通用 CRUD 基类（`apps/api/src/common/base.service.ts`）
- `createCrudRouter` — tRPC CRUD 路由工厂（`apps/api/src/trpc/trpc.helper.ts`）
- `StandardListPage` — 通用列表页组件（`apps/admin/src/shared/components/StandardListPage/`）
- `StandardForm` — 声明式表单组件（`apps/admin/src/shared/components/StandardForm/`）
- `StandardDetailPage` — 通用详情页组件（`apps/admin/src/shared/components/StandardDetailPage/`）
- `FileStorageService` — 多策略文件存储（`apps/api/src/shared/services/file-storage.service.ts`）
- `menuConfig` — 参数化菜单配置（`apps/admin/src/shared/layouts/AdminLayout.tsx`）

### 管理端页面规范

管理端页面**必须**使用三大标准模板组件，禁止手写重复的 CRUD 页面逻辑：

| 组件                 | 用途          | 使用场景                 |
| -------------------- | ------------- | ------------------------ |
| `StandardListPage`   | 列表页        | 所有模块的数据列表展示   |
| `StandardForm`       | 创建/编辑表单 | 所有模块的新增和编辑操作 |
| `StandardDetailPage` | 详情页        | 所有模块的数据详情查看   |

- 列表页、表单、详情页应通过配置驱动，而非手写 Ant Design 组件
- 仅在标准组件无法满足需求时，才使用 `render*` 覆盖插槽进行自定义扩展

## Module Registry

| Module     | Prisma Model | tRPC Router      | REST Controller   | Admin Page    | Web Page       | Miniapp API |
| ---------- | ------------ | ---------------- | ----------------- | ------------- | -------------- | ----------- |
| admin      | Admin        | adminRouter      | -                 | AdminListPage | -              | -           |
| user       | User         | userRouter       | UserController    | UserListPage  | -              | authApi     |
| role       | Role         | roleRouter       | -                 | RoleListPage  | -              | -           |
| agents     | Agent        | agentsRouter     | AgentsController  | AgentListPage | -              | agentsApi   |
| auth       | -            | authRouter       | AuthController    | LoginPage     | Login/Register | authApi     |
| upload     | -            | uploadRouter     | UploadController  | -             | -              | uploadApi   |
| payment    | -            | paymentRouter    | PaymentController | -             | -              | -           |
| permission | Permission   | permissionRouter | -                 | -             | -              | -           |

### Web 端架构说明

- **框架**：Next.js 15 + App Router（`output: 'standalone'`，SSR 模式）
- **API 通信**：REST（不使用 tRPC，因为 tRPC context 仅支持 Admin 用户）
- **认证**：httpOnly Cookie + Next.js Middleware 路由保护
- **路由结构**：`(auth)/` 无需认证（login/register），`(protected)/` 需要认证（dashboard/profile）
- **端口**：3002

## 编码行为准则

> 偏向谨慎而非速度。简单任务用判断力灵活处理。

### 先想后写

- 不假设，不隐藏困惑，主动暴露权衡
- 实现前：显式陈述假设，不确定就问；多种理解时都列出来，不静默选择

### 简单优先

- 只写解决问题所需的最少代码，不做投机性扩展
- 不加没被要求的功能、不为单次使用建抽象、不加没被要求的"灵活性"
- 不为不可能发生的场景写错误处理
- 写了 200 行但 50 行能搞定，就重写
- 自问："资深工程师会觉得这过度复杂吗？"如果是，简化

### 外科手术式变更

- 只改必须改的，只清理自己造成的混乱
- 不"改进"相邻代码、注释、格式；不重构没坏的东西；匹配现有风格
- 注意到无关死代码时提一句，不删除
- 自己的变更产生了孤立 import/变量/函数时才移除，不删预先存在的死代码
- 检验标准：每一行变更都能追溯到用户请求

### 目标驱动执行

- 把任务转化为可验证的目标，循环直到验证通过
- "加验证" → "为无效输入写测试，再让测试通过"；"修 bug" → "写复现测试，再让它通过"
- 多步任务先简述计划：1. [步骤] → verify: [检查] 2. [步骤] → verify: [检查]
- 强成功标准让你能独立循环；弱标准（"让它能跑"）需要不断确认

## 任务追踪

Agent 必须在开发全生命周期使用 `docs/task/` 持久化任务追踪系统，详见 `/task` 技能。

### 核心规则

| 时机                    | 行为                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| **开始新功能/修复前**   | 创建 `docs/task/active/{特征名}.md` 并填写检查清单                       |
| **开发中**              | 逐步勾选清单、更新「当前状态」和「变更文件清单」                         |
| **完成时**              | 文件移入 `docs/task/completed/`，更新 `README.md` 看板                   |
| **新会话 / 恢复上下文** | 先读 `docs/task/README.md` 和 `active/` 下的所有文件，向用户汇报后再继续 |
| **查询进度**            | 用户问「做到哪了」→ 读 README + active 下文件                            |

### Command

- `/task` — 查看/管理当前任务

## Known Issues

- `types/api.ts` uses `type AppRouter = any` instead of importing the real type (tRPC monorepo type resolution issue)
- No Prisma enums in schema — all enum-like fields are `String` with comments
- StandardListPage and generated list pages have duplicated mutation callback patterns
- tRPC context (`verifyJwtToken`) only resolves Admin users — Web/Miniapp users must use REST endpoints
- `@roundtable/shared` `User` interface lacks `nickname`/`phone` fields that exist in Prisma `users` model
