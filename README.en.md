<h1 align="center">Loom</h1>

<p align="center">
  <strong>Clone & Code — Full-stack Management System Scaffold</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Node-%3E%3D18-green.svg" alt="Node">
  <img src="https://img.shields.io/badge/pnpm-workspace-orange.svg" alt="pnpm">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  <a href="README.md">中文</a> · <a href="README.en.md">English</a>
</p>

---

A full-stack management system scaffold for developers. Ships with RBAC, dual-identity auth (Admin + WeChat), WeChat Pay, file upload, and a one-command CRUD module generator. No boilerplate wrestling — clone, configure, code.

## Feature Highlights

| Feature                             | Description                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| **End-to-end Type Safety**          | tRPC `AppRouter` type flows directly to frontend — zero manual API contracts      |
| **CRUD Router Factory**             | `createCrudRouter('Model', schemas)` generates 6 tRPC procedures in one line      |
| **Dual Identity Auth**              | Admin (RBAC) + User (WeChat login), JWT `type` claim auto-isolation               |
| **Permission as Middleware**        | `permissionProcedure('user', 'create')` declarative auth, super_admin auto-bypass |
| **Three-tier Frontend Abstraction** | `StandardListPage` → `StandardForm` → `FieldDefinition` for declarative CRUD UI   |
| **Auto Token Refresh**              | Admin + Miniapp dual 401→refresh→retry with mutex for concurrent prevention       |
| **genModule Generator**             | One command generates Prisma Schema + tRPC Router + Service + Frontend pages      |
| **Business-friendly Errors**        | PostgreSQL constraint violations auto-translated to user-friendly messages        |
| **WeChat Pay Integration**          | JSAPI order + refund + callback verification, ready to use                        |
| **Monorepo Management**             | pnpm Workspace + shared Zod Schema + Prisma Client                                |

## Tech Stack

| Layer        | Tech                                    | Role                                   |
| ------------ | --------------------------------------- | -------------------------------------- |
| **Backend**  | NestJS + tRPC + Prisma + PostgreSQL     | API + type-safe RPC + ORM              |
| **Admin UI** | React 19 + Refine + Ant Design 5 + tRPC | Admin dashboard + strongly-typed calls |
| **Miniapp**  | uni-app + Vue 3 + TypeScript            | WeChat Mini Program                    |
| **Shared**   | Zod + `@loom/shared`                    | Validation Schema + type registry      |
| **Infra**    | pnpm Workspace + Docker + Nginx         | Monorepo + containerized deployment    |

**Type flow — end-to-end type safety from database to UI:**

```
schema.prisma ──► @loom/database ──► AppRouter ──► @loom/shared ──► tRPC Client
     (SSOT)         (Prisma Client)      (tRPC)        (Zod Schema)       (Admin/Miniapp)
```

## Architecture Overview

```
                    ┌─────────────────────────────────────────────┐
                    │              apps/admin (React)              │
                    │  StandardListPage / StandardForm / Auth     │
                    └──────────────────┬──────────────────────────┘
                                       │ tRPC Client (type-safe)
                    ┌──────────────────┴──────────────────────────┐
                    │              apps/api (NestJS)               │
                    │  tRPC Router / BaseService / Guards         │
                    │  Auth / RBAC / Wechat / Payment / Upload / Agents │
                    └──────┬───────────────────────┬──────────────┘
                           │                       │
              ┌────────────┴────────┐   ┌──────────┴──────────┐
              │  PostgreSQL (Prisma) │   │  WeChat Pay / OSS   │
              └─────────────────────┘   └─────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │           apps/miniapp (uni-app)             │
                    │  WeChat Login / User Profile / HTTP Client  │
                    └──────────────────┬──────────────────────────┘
                                       │ REST API (401→refresh→retry)
```

**Dual Identity Model**: Admin users access via tRPC with RBAC permissions; Miniapp Users access via REST and can only operate on their own data. The JWT `type` field (`admin` / `user`) automatically prevents cross-identity access at the gateway level.

## Directory Structure

```
loom/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── modules/        # Business modules (auth, user, admin, role, payment, upload, wechat, agents)
│   │       ├── trpc/           # tRPC config + AppRouter + createCrudRouter factory
│   │       ├── common/         # BaseService base class
│   │       └── core/           # Guards, Filters, Interceptors
│   ├── admin/                  # React + Refine admin dashboard
│   │   └── src/
│   │       ├── modules/        # Business pages (admin, user, role, auth, agents)
│   │       └── shared/        # StandardListPage, StandardForm, dataProvider, trpcClient
│   └── miniapp/                # uni-app WeChat mini program
│       └── src/
│           ├── pages/          # Pages (index, login, profile, agents)
│           ├── api/            # REST API calls
│           └── utils/          # HTTP Client (token refresh + mutex)
├── infra/
│   ├── database/               # Prisma Schema + Client + Seed + Migrations
│   └── shared/                 # @loom/shared (Zod Schema + types)
├── docs/                       # Technical documentation
├── .claude/                    # Claude Code skills + agents + hooks
├── docker-compose.prod.yml     # Production Docker Compose
├── docker-compose.local.yml    # Local test Docker Compose
└── .env.example                # Environment variable template
```

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/loom.git my-project
cd my-project

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env, fill in DATABASE_URL and JWT_SECRET

# 4. Start PostgreSQL (Docker)
docker compose -f docker-compose.local.yml up -d

# 5. Database migration + seed
cd infra/database && npx prisma migrate dev && npx prisma db seed && cd ../..

# 6. Start dev servers
pnpm dev
```

**Verify services:**

| Service    | URL                              | Test Account                           |
| ---------- | -------------------------------- | -------------------------------------- |
| API        | `http://localhost:3000`          | —                                      |
| Swagger    | `http://localhost:3000/api/docs` | —                                      |
| Admin      | `http://localhost:5173`          | `superadmin@example.com / password123` |
| Miniapp H5 | `http://localhost:8080`          | `user@example.com / password123`       |

## Development Commands

### CLI Commands

| Command                                       | Description                                |
| --------------------------------------------- | ------------------------------------------ |
| `pnpm dev`                                    | Start all services (API + Admin + Miniapp) |
| `pnpm --filter @loom/api dev`                 | Start backend API only                     |
| `pnpm --filter admin dev`                     | Start admin dashboard only                 |
| `pnpm --filter @loom/miniapp dev`             | Start miniapp H5 only                      |
| `pnpm build`                                  | Build entire monorepo                      |
| `pnpm type-check`                             | TypeScript type checking                   |
| `cd infra/database && npx prisma migrate dev` | Run database migration                     |
| `cd infra/database && npx prisma db seed`     | Seed database                              |

### Claude Code Slash Commands

> Use [Claude Code](https://claude.ai/code) CLI for AI-assisted development

| Command                | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `/genModule <name>`    | Interactive full-stack CRUD module generation                    |
| `/init-project`        | Initialize new project (rename packages, database, env vars)     |
| `/analyze`             | Analyze existing modules, identify standardization opportunities |
| `/refactor`            | Refactor to scaffold standard patterns                           |
| `/deleteModule <name>` | Delete module (clean up frontend, backend, and schema)           |
| `/seed-data`           | Create seed data                                                 |
| `/db-migrate`          | Run migration + generate Prisma Client + seed                    |
| `/sync`                | Sync workspace (Prisma Generate + Build Shared)                  |

## Core Abstractions

### BaseService — CRUD Base Class

Extend to get full CRUD operations with lifecycle hooks:

```typescript
@Injectable()
export class ProductService extends BaseService<'Product'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Product');
  }
  // Available: list, getOne, create, update, remove, removeMany, count, exists
  // Overridable hooks: beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
  // Row-level auth: checkOwnership(userId, recordId)
}
```

### createCrudRouter — tRPC Router Factory

Generate 6 standard CRUD procedures in one line:

```typescript
export const productRouter = createCrudRouter(
  'Product',
  {
    create: CreateProductSchema,
    update: UpdateProductSchema,
  },
  {
    protectedGetMany: true,
    protectedCreate: true,
  },
);
// Generates: getMany, getOne, create, update, delete, deleteMany
```

Use `createCrudRouterWithCustom` to merge custom procedures alongside CRUD.

### permissionProcedure — Declarative Authorization

```typescript
// Declare permission in tRPC router — super_admin auto-bypasses all
create: permissionProcedure('product', 'create')
  .input(CreateProductSchema)
  .mutation(async ({ ctx, input }) => { /* ... */ }),
```

### StandardListPage + StandardForm — Declarative Frontend

```tsx
// List page: columns + search + filter + statistics + permissions
<StandardListPage
  resource="products"
  title="Products"
  columns={columns}
  searchFields={[{ field: 'name', placeholder: 'Search by name' }]}
  formComponent={ProductForm}
  permissions={{ create: 'product:create', update: 'product:update', delete: 'product:delete' }}
/>;

// Form: declarative field definitions
const fields: FieldDefinition[] = [
  { key: 'name', label: 'Name', type: 'input', required: true },
  { key: 'price', label: 'Price', type: 'number', min: 0, precision: 2 },
  { key: 'categoryId', label: 'Category', type: 'select', resource: 'categories' },
  { key: 'cover', label: 'Cover', type: 'upload', maxFileSize: 2 },
  { key: 'isActive', label: 'Active', type: 'switch' },
];
```

### Dual Identity + Auto Token Refresh

```
Admin Login ──► JWT { sub, email, type: 'admin' } ──► tRPC (RBAC)
User  Login ──► JWT { sub, openId, type: 'user'  } ──► REST  (ownership)

401 Response ──► Mutex Lock ──► Refresh Token ──► Retry Original ──► Unlock
```

### Business-friendly Error Translation

```
PostgreSQL: "duplicate key value violates unique constraint" on field `email`
    ──► User sees: "该邮箱已存在，请使用其他值"

PostgreSQL: "violates foreign key constraint" on table `orders`
    ──► User sees: "该订单已有其他数据关联，无法删除"
```

## genModule Code Generator

One command generates a complete full-stack CRUD module:

```bash
/genModule product
```

**Generated targets:**

| Target                  | Path                                                        |
| ----------------------- | ----------------------------------------------------------- |
| Prisma Model            | `infra/database/prisma/schema.prisma` (appended)            |
| tRPC Router             | `apps/api/src/modules/product/trpc/product.router.ts`       |
| NestJS Module           | `apps/api/src/modules/product/module.ts`                    |
| List Page               | `apps/admin/src/modules/product/pages/ProductListPage.tsx`  |
| Form Component          | `apps/admin/src/modules/product/components/ProductForm.tsx` |
| App Router Registration | `apps/api/src/trpc/app.router.ts` (appended)                |
| Refine Resource         | `apps/admin/src/App.tsx` (appended)                         |

**Smart field inference:**

| Field pattern       | Inferred UI component                     |
| ------------------- | ----------------------------------------- |
| `price`, `amount`   | InputNumber + ¥ formatter + min:0         |
| `email`             | email validation rules                    |
| `phone`             | phone regex validation                    |
| `avatar`, `cover`   | OSSUpload image upload                    |
| `parentId`          | TreeSelect (auto-detect tree structure)   |
| `*Id` (foreign key) | Select dropdown (auto-associate resource) |
| `is*`               | Switch toggle                             |
| `*At` (date)        | DatePicker + showTime                     |

## Coding Conventions

| Convention    | Example                                |
| ------------- | -------------------------------------- |
| File naming   | `feature-name.service.ts` (kebab-case) |
| TS variables  | `camelCase`                            |
| DB fields     | `snake_case` (via `@@map`)             |
| Prisma models | `PascalCase`                           |
| tRPC routes   | Aligned with Prisma model name         |
| Zod schemas   | `CreateXxxSchema` / `UpdateXxxSchema`  |

**SSOT (Single Source of Truth):**

- `schema.prisma` is the single model truth source
- `infra/shared` is the single validation truth source
- All apps share `@loom/shared` types

**Data isolation:**

- Admin users access all data
- User users access only their own data (`where: { userId: user.id }`)
- `createdById` / `updatedById` auto-injected from JWT context

## Deployment

### Docker Compose (Recommended)

```bash
cp .env.example .env.prod
# Edit .env.prod with production values
docker compose -f docker-compose.prod.yml up -d
```

Containers: `api` (NestJS), `admin` (Nginx + static), `postgres`, `redis`

### GitHub Actions CI/CD

The project includes `.github/workflows/ci.yml` that runs on push to `main`:

1. **build** — install → type-check → build
2. **migrate** — after build passes, runs `prisma migrate deploy` to sync production database (not triggered on PRs)

> Requires `PROD_DATABASE_URL` in GitHub Secrets

**Schema change workflow:**

```
Edit schema.prisma → /db-migrate → /sync → git commit & push → CI auto migrate deploy
```

### 1Panel Deployment

See `.env.prod.example` for production environment configuration.

For detailed deployment guides, see `docs/deployment-guide.md` and `docs/deployment-checklist.md`.

## Environment Variables

| Variable                 | Required | Default          | Description                   |
| ------------------------ | -------- | ---------------- | ----------------------------- |
| `DATABASE_URL`           | Yes      | —                | PostgreSQL connection string  |
| `JWT_SECRET`             | Yes      | —                | JWT signing key (>=32 chars)  |
| `JWT_EXPIRES_IN`         | No       | `7d`             | Access token expiration       |
| `JWT_REFRESH_EXPIRES_IN` | No       | `30d`            | Refresh token expiration      |
| `CORS_ORIGIN`            | No       | `localhost:5173` | Allowed frontend domains      |
| `PORT`                   | No       | `3000`           | API server port               |
| `WX_APP_ID`              | No       | —                | WeChat Mini Program AppID     |
| `WX_APP_SECRET`          | No       | —                | WeChat Mini Program AppSecret |
| `WX_PAY_MCH_ID`          | No       | —                | WeChat Pay merchant ID        |

See `.env.example` for the complete list.

## Built-in Modules

| Module     | Backend                                       | Frontend                      | Description                             |
| ---------- | --------------------------------------------- | ----------------------------- | --------------------------------------- |
| auth       | auth.service + auth.router                    | LoginPage + SessionExpired    | Dual identity auth + JWT                |
| user       | user.service + user.router                    | UserListPage + UserDetail     | Miniapp user CRUD                       |
| admin      | admin.service + admin.router                  | AdminListPage + AdminDetail   | Admin CRUD + RBAC                       |
| role       | role.service + role.router                    | RoleListPage + RoleDetail     | Role management + permission assignment |
| permission | permission.service + permission.router        | —                             | Permission registry                     |
| upload     | upload.service + upload.router                | OSSUpload component           | Multi-strategy file storage             |
| payment    | payment.service + payment.router              | —                             | WeChat Pay JSAPI + refund               |
| wechat     | wechat.service                                | —                             | WeChat login + mini program API         |
| agents     | agents.service + dify.service + agents.router | AgentListPage + AgentChatPage | Dify AI Agent chat (SSE streaming)      |

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a Pull Request

Follow existing patterns — prefer `BaseService` and `createCrudRouter`, add Zod schemas to `@loom/shared`. Run `pnpm type-check` before submitting.

## License

[MIT](LICENSE)

## Acknowledgments

- [NestJS](https://nestjs.com/) — Progressive Node.js framework
- [tRPC](https://trpc.io/) — End-to-end type-safe RPC
- [Prisma](https://www.prisma.io/) — Next-generation ORM
- [Refine](https://refine.dev/) — React admin panel framework
- [Ant Design](https://ant.design/) — Enterprise UI component library
- [uni-app](https://uniapp.dcloud.net.cn/) — Cross-platform mini program framework
