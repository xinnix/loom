# AGENTS.md - Loom Monorepo 脚手架指南

## 🎯 脚手架定位

**开箱即用的全栈管理系统脚手架**，基于 Agent-Centric 开发模式。

### 核心特性

- ✅ 完整的 RBAC 权限系统（Admin 端，类型安全 Permission Registry）
- ✅ 双用户认证体系（Admin + User，支持微信登录）
- ✅ 开箱即用的 CRUD 模板生成（`/genModule`）
- ✅ 端到端类型安全（tRPC）
- ✅ 多端支持（Admin 后台 + Web 用户端 + 小程序 + Landing）
- ✅ 微信支付（JSAPI + 退款）、多策略文件存储、LLM 抽象层
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
| **Web**      | Next.js 15 + Tailwind CSS v4（SSR，REST）    |
| **Landing**  | Next.js 15 + Tailwind CSS v4（SSG）          |
| **Miniapp**  | uni-app + Vue 3 + TypeScript                 |
| **Monorepo** | pnpm Workspace                               |

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
├── web/          # Next.js 用户端（SSR，REST）
├── landing/      # Next.js 落地页（SSG）
└── miniapp/      # uni-app 小程序壳
infra/
├── database/     # Prisma Schema + Client + Seed
└── shared/       # Zod Schema + 类型定义
docs/             # 分层文档体系（见文末索引）
```

---

## 💻 快速命令

```bash
pnpm install                    # 安装依赖
pnpm dev                        # 启动全部服务（API + Admin + Miniapp）
pnpm build                      # 构建全部项目
```

### 数据库操作

```bash
pnpm --filter @loom/database prisma generate    # 生成 Client
pnpm --filter @loom/database prisma migrate dev # 运行迁移
```

**Seed：推荐用 SQL 脚本直灌**（Prisma 7.x adapter 存在兼容性问题）：

```bash
docker exec -i postgres psql -U xinnix -d loom < infra/database/prisma/seed-base.sql
```

测试账号：管理端 `superadmin@example.com / password123`；用户端 `user@example.com / password123`。

> 日常开发优先使用下文 slash 技能（`/db-migrate`、`/start-all` 等），它们封装了上述步骤。

---

## ✍️ 核心规范

### 1. 编码风格

**后端 CRUD 模式：**

```typescript
// 必须继承 BaseService
export class ProductService extends BaseService<Product> {
  constructor(prisma: PrismaService) {
    super(prisma, 'product');
  }
}
```

**命名规范：**

- 文件：`feature-name.service.ts`（小写横杠）
- TS 变量：`camelCase`
- 数据库字段：`snake_case`
- tRPC 路由：与 Prisma 模型名对齐

**SSOT 原则（红线）：**

- `schema.prisma` 是唯一的模型真理源
- `infra/shared` 是唯一的验证真理源
- 所有端共享 `@loom/shared` 类型
- 生产数据库只走 `migrate deploy`，禁止 `db push`

### 2. 管理端页面规范

管理端页面**必须**使用三大标准组件，禁止手写重复 CRUD 逻辑：`StandardListPage`（列表）、`StandardForm`（表单）、`StandardDetailPage`（详情）。仅在标准组件无法满足时用 `render*` 插槽扩展。

### 3. 双用户认证体系

**Admin 用户（管理后台）：** `admins` 表，RBAC 角色-权限，Token `{ sub, email, type: 'admin' }`，走 tRPC。

**User 用户（Web + 小程序）：** `users` 表，微信登录 / 邮箱注册，Token 含 `type: 'user'`，走 REST；Web 端存 httpOnly Cookie，小程序存本地存储。

**关键约束：**

- ⚠️ tRPC context 只解析 Admin 用户；Web/小程序用户必须走 REST
- ⚠️ 小程序/Web 用户无权访问管理端路由
- ⚠️ User 数据隔离：只能访问自己的数据（`where: { userId }`）

### 4. 小程序规范

- 统一使用 `src/utils/http.ts` HTTP 客户端
- API 端点在 `src/config/api.ts` 统一管理
- 每个模块独立 API 文件 `src/api/*.ts`

---

## 📝 工作流

### 开发前必读

1. 读 `docs/ROADMAP.md` 了解当前阶段
2. 读 `docs/product/prd.md` 对应功能规格与验收标准
3. 新需求先过 `docs/product/vision.md` 红线检查，进 `docs/product/backlog.md`，不直接实现
4. 用 `/genModule <name>` 生成模块骨架

### 开发后必做

1. 在 `docs/task/active/` 维护任务文档（`/task`），完成移入 `completed/`
2. 回写 `docs/ROADMAP.md`（产物 + 日期）；PRD 事实有变同步更新
3. 新模块过一遍模块健康检查清单（`docs/dev/module-health-checklist.md`）

---

## 🤖 Agent Skills

| 技能                                                                                           | 用途                                         |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `/genModule <name>`                                                                            | 生成全栈 CRUD 模块                           |
| `/init-project`                                                                                | 初始化新项目（身份替换 + 验证）              |
| `/scaffold-clean`                                                                              | 移除 Todo 示例模块，得到空白项目             |
| `/db-migrate`                                                                                  | 迁移 + Prisma Client + Seed                  |
| `/sync`                                                                                        | 同步工作区（Prisma Generate + Build Shared） |
| `/start-all` / `/start-api` / `/start-admin` / `/start-web` / `/start-landing` / `/start-mini` | 启动服务                                     |
| `/build-all` / `/type-check` / `/validate` / `/lint`                                           | 构建与质量                                   |
| `/seed-data`                                                                                   | 创建假数据                                   |
| `/task`                                                                                        | 查看/管理 docs/task/ 下的任务                |
| `/analyze` / `/refactor` / `/simplify` / `/deleteModule`                                       | 模块分析与治理                               |
| `/enum-sync`                                                                                   | Prisma 枚举同步到 Zod/前端                   |

---

## 🔀 多 Agent 工具支持

技能源为 `.claude/skills/`（唯一真理源），由 `scripts/sync-agents.sh` 镜像分发到各工具的发现目录（SKILL.md 格式四工具通用，仅目录不同）：

| 工具        | 说明文件  | 技能目录                |
| ----------- | --------- | ----------------------- |
| Claude Code | CLAUDE.md | `.claude/skills/`（源） |
| Codex       | AGENTS.md | `.agents/skills/`       |
| OpenCode    | AGENTS.md | `.opencode/skills/`     |
| ZCode       | AGENTS.md | `.zcode/skills/`        |

- 修改技能后运行 `scripts/sync-agents.sh`；CI/手动校验漂移用 `scripts/sync-agents.sh --check`
- **Claude Code 专属、其他工具不可用的能力**：`.claude/commands/`（斜杠命令入口——其他工具靠技能 description 自动匹配调用，能力等价）、`.claude/agents/`（subagent）、`.claude/hooks/`（自动格式化/迁移保护等防御机制——其他工具下依赖本文档文字规则自律，红线仍然生效）

---

## 📚 参考文档

| 主题       | 文档                                                            |
| ---------- | --------------------------------------------------------------- |
| 体系总览   | `docs/README.md`                                                |
| 愿景与红线 | `docs/product/vision.md`                                        |
| 功能规格   | `docs/product/prd.md`                                           |
| 落地剧本   | `docs/product/mvp.md`                                           |
| 任务池     | `docs/product/backlog.md`                                       |
| 阶段进度   | `docs/ROADMAP.md`                                               |
| 架构决策   | `docs/adr/`                                                     |
| 部署与配置 | `docs/ops/deployment.md`、`docs/ops/env-configuration-guide.md` |
| 开发参考   | `docs/dev/`（健康检查清单、错误处理、上传、Todo 参考模块）      |
