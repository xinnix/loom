---
name: genModule
description: 全栈 CRUD 模块生成器——Prisma/Zod/tRPC + REST Controller + Admin 三件套（StandardListPage/StandardForm/StandardDetailPage）+ miniapp API client + Web REST client，支持自定义字段与中文文案。
allowed-tools:
  - Bash(node:*)
  - Bash(cd:*)
  - Bash(mkdir -p:*)
  - Bash(chmod:*)
  - Bash(ln -s:*)
  - Bash(find:*)
  - Bash(tsx:*)
---

# Quick Start (Automated)

```bash
# Smart analysis (recommended - detects patterns + infers fields)
node .claude/skills/genModule/scripts/generate-module.ts product

# Preview mode with smart inference report
node .claude/skills/genModule/scripts/generate-module.ts article --dry-run

# 自定义字段 + 中文名称 + 枚举中文文案
node .claude/skills/genModule/scripts/generate-module.ts bookmark \
  --fields '[{"name":"name","type":"string","required":true},{"name":"status","type":"enum","required":true,"enum":["active","archived"]}]' \
  --meta '{"label":"收藏","enumLabels":{"status":{"active":"启用","archived":"归档"}}}'

# 纯管理端模块（跳过 REST Controller）
node .claude/skills/genModule/scripts/generate-module.ts category --no-rest
```

**What it generates:**

- Database: Prisma schema（含 userId 数据隔离字段与 createdById/updatedById 审计字段）+ 迁移
- Shared: Zod schemas + Permission Registry 权限注册
- Backend (Admin): tRPC router + spec 测试
- Backend (外部端): REST Controller（`/api/<plural>`，JwtAuthGuard + userId 隔离；`--no-rest` 跳过）
- Admin 前端: StandardListPage 列表页 + StandardForm 表单 + **StandardDetailPage 详情页** + 双 barrel + 路由/菜单/资源注册
- Miniapp: API client + 端点注册（页面手写）
- Web: REST client（`apps/web/src/lib/api/<camel>.ts`，wire 类型 + 枚举字典 + apiClient 封装）（页面手写）
- Auto-registration: App.tsx、app.router.ts、AdminLayout.tsx、app.module.ts

> **明确不生成**：Web 端页面、miniapp 端页面（各端页面个性化程度高，按项目手写；REST Controller 与 client 已就位）。

**CLI 参数：**

| 参数                | 说明                                                                |
| ------------------- | ------------------------------------------------------------------- |
| `--fields '<json>'` | 自定义字段数组 `[{name,type,required,enum?}]`；缺省按业务模式推断   |
| `--meta '<json>'`   | 中文文案 `{label, fieldLabels, enumLabels}`；Agent 编排时向用户收集 |
| `--no-rest`         | 跳过 REST Controller（纯 Admin 模块）；缺省生成                     |
| `--dry-run`         | 预览文件清单 / 枚举字典 / Zod 预览，不写文件                        |

**Safety features:**

- Idempotency check: Refuses to regenerate an existing module
- Input validation: Validates module name format and reserved names
- Project structure validation: Checks required files exist
- Automatic rollback: Reverts all changes if any step fails
- Dry-run mode: Preview without writing files

**Supported Business Patterns:**

- E-commerce: `product`, `item`, `goods`, `order`, `purchase`
- Content: `article`, `post`, `blog`, `news`, `content`
- Tasks: `todo`, `task`, `assignment`, `chore`
- Organization: `category`, `group`, `section`, `topic`
- User: `user`, `customer`, `member`, `profile`
- And more...

**After generation:**

```bash
cd infra/database && npx prisma migrate dev --name add_<module>
npx prisma generate
pnpm --filter @loom/shared build   # 权限注册进 dist，Admin 菜单依赖它
```

---

# 编排流程（Agent）

genModule 由 Agent 执行时按以下顺序编排（先收集、再预览、后生成）：

1. **问模块名与中文名**：`--meta.label`（如「收藏」）；不给则用英文 toLabel
2. **问字段**：逐字段确认 name/type/required；enum 字段同步收集每个枚举值的中文文案 → 组装 `--fields` 与 `--meta`（含 `fieldLabels`/`enumLabels`）
3. **问是否需要外部端**：无 Web/小程序诉求的纯管理模块传 `--no-rest`
4. **`--dry-run` 预览**：向用户展示文件清单、枚举字典、Zod 预览，确认后执行
5. **执行生成**
6. **引导收尾**：`/db-migrate` → `pnpm --filter @loom/shared build` → `/type-check`（api/admin/web 全绿）

# Smart Field Inference (Phase 2)

The generator automatically detects field types and applies smart configurations:

| Field Pattern             | UI Component              | Validation                          | Example                      |
| ------------------------- | ------------------------- | ----------------------------------- | ---------------------------- |
| `price`, `amount`, `cost` | InputNumber (¥ formatter) | `z.number().min(0)`                 | price: Float → ¥1,234.56     |
| `email`, `mail`           | Input (email)             | `z.string().email()`                | email: String → validation   |
| `phone`, `mobile`         | Input (tel)               | `z.string().regex(/^1[3-9]\d{9}$/)` | phone: String → validation   |
| `url`, `website`          | Input (url)               | `z.string().url()`                  | website: String → validation |
| `slug`, `code`            | Input (auto-gen)          | `z.string().regex(/^[a-z0-9-]+$/)`  | slug: String → auto          |
| `avatar`, `cover`, `logo` | OSSUpload                 | `z.string().optional()`             | cover: String → upload       |
| `*At`, `*Date`            | DatePicker (showTime)     | `z.date()`                          | publishedAt: DateTime        |
| `rate`, `percent`         | InputNumber (% formatter) | `z.number().min(0).max(100)`        | discount: Float              |
| `sortOrder`, `priority`   | InputNumber (min:0)       | `z.number().int().min(0)`           | sortOrder: Int               |
| `*Id` fields              | Select/TreeSelect         | `z.string().optional()`             | categoryId → Category        |

---

# Relation Auto-Detection (Phase 2)

The generator automatically detects foreign key fields and generates:

| Field Name   | Detected Relation        | UI Component        |
| ------------ | ------------------------ | ------------------- |
| `categoryId` | Category.belongsTo       | Select (searchable) |
| `userId`     | User.belongsTo           | Select (searchable) |
| `parentId`   | Self.belongsTo           | TreeSelect          |
| `authorId`   | User.belongsTo           | Select (searchable) |
| `merchantId` | Merchant.belongsTo       | Select (searchable) |
| `templateId` | CouponTemplate.belongsTo | Select (searchable) |

---

# UI Pattern Selection (Phase 2)

The generator automatically selects the best UI pattern:

| Condition                          | Pattern  | Pages Generated               |
| ---------------------------------- | -------- | ----------------------------- |
| Has rich text (content, body)      | Separate | List + Create + Edit + Detail |
| Has state machine (4+ enum values) | Separate | List + Detail                 |
| Has tree structure (parentId)      | Modal    | List only                     |
| Has multiple images                | Modal    | List only                     |
| Default                            | Modal    | List only                     |

---

# Manual Workflow (Custom Implementation)

When you need custom logic beyond the generator, follow these steps:

## Step 1: Database Layer (Prisma Schema)

**Location:** `infra/database/prisma/schema.prisma`

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  price       Float
  description String?
  priority    Int      @default(2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Actions:**

1. Add model to `schema.prisma`
2. Run migration: `cd infra/database && npx prisma migrate dev --name add_product`
3. Generate client: `npx prisma generate`

---

## Step 2: Shared Validation Layer (Zod Schemas)

**Location:** `infra/shared/src/index.ts`

```typescript
// Product Schemas
export const ProductSchema = {
  createInput: z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    description: z.string().optional(),
  }),
  // updateInput is the data part only (id is handled by tRPC helper wrapper)
  updateInput: z.object({
    name: z.string().optional(),
    price: z.number().optional(),
    description: z.string().nullable().optional(), // Accept null from form
  }),
  getOneInput: z.object({ id: z.string() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.string() }),
};
```

**Important Notes:**

- **updateInput should NOT include `id`** - it's handled by the tRPC helper wrapper `{ id, data, ... }`
- **Optional string fields should be nullable** - forms may send `null` for empty fields
- Use `.nullable().optional()` for optional strings that may receive null from forms

---

## Step 3: Backend tRPC Layer

**Option A: Factory Function (Recommended for standard CRUD)**

**Location:** `apps/api/src/modules/product/trpc/product.router.ts`

```typescript
import { createCrudRouter } from '../../../trpc/trpc.helper';
import { ProductSchema } from '@loom/shared';

export const productRouter = createCrudRouter('Product', {
  create: ProductSchema.createInput,
  update: ProductSchema.updateInput,
  getMany: ProductSchema.getManyInput,
  getOne: ProductSchema.getOneInput,
});
```

**⚠️ Important Notes:**

- Use **relative import path** `../../../trpc/trpc.helper` (NOT `@shared/trpc/trpc.helper`)
- Use **@loom/shared** for schema imports (NOT `@shared/index`)
- Parameters format: `(modelName, { create, update, getMany, getOne })` - NOT object format

**Option B: Custom Router (For complex logic)**

See [references/custom-router.md](references/custom-router.md) for custom implementation patterns.

**Register Router:**

In `apps/api/src/trpc/app.router.ts`:

```typescript
import { productRouter } from '../../modules/product/trpc/product.router';

export const appRouter = router({
  product: productRouter,
  // ... other routers
});
```

---

## Step 4: Frontend UI Layer

**Location:** `apps/admin/src/modules/product/`

**Step 4.1 - Create Module index.ts (REQUIRED):**

Create `apps/admin/src/modules/product/index.ts`:

```typescript
export { ProductListPage } from './pages/ProductListPage';
```

**⚠️ Important:** Each module MUST have an `index.ts` at its root, or imports will fail.

**Step 4.2 - Add Resource to Refine:**

In `apps/admin/src/App.tsx`:

```typescript
// Add import
import { ProductListPage } from "./modules/product";

// Add to resources (inside Refine component)
resources={[
  {
    name: 'product',
    list: '/products',
  },
]}

// Add route (MUST be inside AdminLayout Route)
<Route path="/" element={<AdminLayout />}>
  {/* Other routes... */}
  <Route path="products" element={<ProductListPage />} />
</Route>
```

**Step 4.3 - Update Sidebar:**

In `apps/admin/src/shared/layouts/AdminLayout.tsx`:

```typescript
// Add to menuItems array
{
  key: "/products",
  icon: <ShoppingCartOutlined />, // Choose appropriate icon
  label: "产品",
  onClick: () => navigate("/products"),
},
```

**Step 4.4 - Create List Page (Auto-generated):**

When using `genModule`, the list page is auto-generated using `StandardListPage`:

```typescript
// apps/admin/src/modules/product/pages/ProductListPage.tsx
// Auto-generated — uses StandardListPage for config-driven CRUD
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import { ProductForm } from '../components';

export const ProductListPage = () => {
  const navigate = useNavigate();

  // columns defined by smart field inference
  const allColumns = [
    { title: '名称', dataIndex: 'name' },
    { title: '价格', dataIndex: 'price', render: ... },
    // ...
  ];

  return (
    <StandardListPage
      resource="product"
      title="产品管理"
      columns={allColumns}
      formComponent={ProductForm}
      formWidth={520}
      searchFields={[{ field: 'search', placeholder: '搜索名称' }]}
      filterFields={[/* enum/boolean filter fields */]}
      renderRowActions={(record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}
            onClick={() => navigate(`/products/${record.id}`)}>
            详情
          </Button>
        </Space>
      )}
    />
  );
};
```

**Step 4.5 - Form Component (Auto-generated):**

Form uses `StandardForm` with `FieldDefinition[]` configuration:

```typescript
// apps/admin/src/modules/product/components/ProductForm.tsx
// Auto-generated — declares fields, StandardForm handles rendering
import { StandardForm } from "../../../shared/components/StandardForm";
import type { FieldDefinition } from "../../../shared/components/StandardForm/types";
import type { FormInstance } from "antd/es/form";
import { TreeSelect } from "antd";

export const formFields: FieldDefinition[] = [
  { key: 'name', label: '名称', type: 'input', required: true },
  { key: 'description', label: '描述', type: 'textarea' },
  { key: 'price', label: '价格', type: 'number', min: 0, precision: 2,
    formatter: (value: any) => `¥ ${value}`.replace(...) },
  { key: 'sku', label: 'SKU', type: 'input', required: true },
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]},
  { key: 'images', label: '图片', type: 'upload',
    accept: 'image/jpeg,image/png', maxFileSize: 5 * 1024 * 1024 },
  { key: 'isActive', label: '启用', type: 'switch' },
  { key: 'categoryId', label: '分类', type: 'select', options: [] },
];

export function ProductForm({ form, isEdit }: { form: FormInstance; isEdit: boolean }) {
  return <StandardForm form={form} isEdit={isEdit} fields={formFields} />;
}
```

**Module Index (Auto-generated):**

The module `index.ts` exports both the page and form component:

```typescript
// apps/admin/src/modules/product/index.ts
export { ProductListPage } from './pages/ProductListPage';
export { ProductForm } from './components/ProductForm';
```

````

---

# CRUD Function Naming Convention

## Unified Naming Convention

This project uses a **unified naming convention** - all operations use the same names:

### tRPC Procedure Names (Generated by createCrudRouter)

| Procedure    | Type     | Description                    | Input Format                                           |
| ------------ | -------- | ------------------------------ | ------------------------------------------------------ |
| `getMany`    | Query    | List with pagination           | `{ page, limit, where?, orderBy?, include?, select? }` |
| `getOne`     | Query    | Get single record by ID        | `{ id, include?, select? }`                            |
| `create`     | Mutation | Create single record           | `{ data, include?, select? }`                          |
| `update`     | Mutation | Update single record by ID     | `{ id, data, include?, select? }`                      |
| `delete`     | Mutation | Delete single record by ID     | `{ id }`                                               |
| `deleteMany` | Mutation | Delete multiple records by IDs | `{ ids }`                                              |

### createCrudRouter Usage

```typescript
createCrudRouter('Product', {
  create: ProductSchema.createInput, // ← Schema for create
  update: ProductSchema.updateInput, // ← Schema for update
  getMany: ProductSchema.getManyInput,
  getOne: ProductSchema.getOneInput,
});
````

### dataProvider → tRPC Mapping

The Refine dataProvider automatically calls these tRPC procedures:

| Refine Method | tRPC Procedure Called |
| ------------- | --------------------- |
| `getList`     | `resource.getMany`    |
| `getOne`      | `resource.getOne`     |
| `create`      | `resource.create`     |
| `update`      | `resource.update`     |
| `deleteOne`   | `resource.delete`     |
| `deleteMany`  | `resource.deleteMany` |

**Example:**

```typescript
// Frontend: useCreate hook calls dataProvider.create()
create({ resource: "order", values: { ... } })

// dataProvider calls tRPC
trpc.order.create.mutate({ data: { ... } })
```

## Important Notes

1. **Unified naming**: All operations use `create`, `update`, `delete`, `getMany`, `getOne`, `deleteMany` (NO `One` suffix)
2. **createCrudRouter parameters** match the procedure names exactly
3. **Refine hooks** match the procedure names exactly
4. **dataProvider** maps directly (no name transformation)
5. **Resource names must match exactly** - `order` in Refine must map to `order` in tRPC router

---

# Decision Tree

```
Need custom business logic?
├─ Yes → Use custom router with full implementation
└─ No → Use createCrudRouter factory function

Need permissions/authorization?
├─ Yes → Use protectedProcedure instead of publicProcedure
└─ No → Use publicProcedure

Need REST API for external clients?
├─ Yes → Create REST controller (see references/rest-layer.md)
└─ No → tRPC only (admin dashboard)
```

---

# Advanced Topics

- **Custom Router Patterns**: [references/custom-router.md](references/custom-router.md)
- **Frontend Templates**: [references/frontend-templates.md](references/frontend-templates.md)
- **REST Layer**: [references/rest-layer.md](references/rest-layer.md)
- **File Upload**: [references/file-upload.md](references/file-upload.md)

---

# Troubleshooting

## Common Errors and Solutions

### Error 1: Module Import Path Not Found

**Symptom:**

```
Cannot find module '@shared/trpc/trpc.helper' or '@shared/index'
```

**Solution:**
Use relative import paths instead of workspace aliases:

```typescript
// ❌ WRONG
import { createCrudRouter } from '@shared/trpc/trpc.helper';
import { ProductSchema } from '@shared/index';

// ✅ CORRECT
import { createCrudRouter } from '../../../trpc/trpc.helper';
import { ProductSchema } from '@loom/shared';
```

---

### Error 2: TypeError - Cannot Read Properties

**Symptom:**

```
TypeError: Cannot read properties of undefined (reading 'getMany')
```

**Solution:**
The createCrudRouter parameters are in wrong format. Use tuple format:

```typescript
// ❌ WRONG - Object format
export const productRouter = createCrudRouter({
  modelName: 'Product',
  createSchema: ProductSchema.createInput,
  updateSchema: ProductSchema.updateInput,
});

// ✅ CORRECT - Tuple format
export const productRouter = createCrudRouter('Product', {
  create: ProductSchema.createInput,
  update: ProductSchema.updateInput,
  getMany: ProductSchema.getManyInput,
  getOne: ProductSchema.getOneInput,
});
```

---

### Error 3: Frontend Module Import Failed

**Symptom:**

```
Failed to resolve import "./modules/product" from "src/App.tsx"
```

**Solution:**
Create the missing `index.ts` file at the module root:

```typescript
// apps/admin/src/modules/product/index.ts
export { ProductListPage } from './pages/ProductListPage';
```

**Why this happens:** Each module MUST export its components through an `index.ts` file at its root directory.

---

### Error 4: Create Component Not Found

**Symptom:**

```
The requested module does not provide an export named 'Create'
```

**Solution:**
This project uses **Modal pattern**, not separate Create/Edit pages. Rewrite your list page:

```typescript
// ❌ WRONG - Separate Create page (doesn't exist in this project)
<Route path="products/create" element={<Create />} />

// ✅ CORRECT - Modal pattern in List page
export const ProductListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  // ... useCreate, useUpdate hooks
  // ... Modal component with Form
};
```

---

### Error 5: Sidebar Disappears

**Symptom:**
After clicking a menu item, the sidebar disappears.

**Solution:**
Routes must be **inside** the AdminLayout Route:

```typescript
// ❌ WRONG - Route outside AdminLayout
<Route path="/" element={<AdminLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />
</Route>
<Route path="products" element={<ProductListPage />} /> {/* Sidebar gone! */}

// ✅ CORRECT - All routes inside AdminLayout
<Route path="/" element={<AdminLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />
  <Route path="products" element={<ProductListPage />} /> {/* Sidebar visible */}
</Route>
```

---

### Error 6: 400 Bad Request on Create - Type Mismatch

**Symptom:**

```
POST http://localhost:3000/trpc/product.create 400 (Bad Request)
Invalid input: expected number, received string
```

**Cause:**
Ant Design's `<Input type="number">` returns a **string**, not a number.

**Solution:**
Convert string values to numbers before submitting:

```typescript
const handleSubmit = async () => {
  const values = await form.validateFields();

  // Convert numeric fields from string to number
  const numericFields = ['price', 'stock', 'total']; // Add your numeric fields
  const processedValues = { ...values };
  numericFields.forEach((field) => {
    if (processedValues[field]) {
      processedValues[field] = Number(processedValues[field]);
    }
  });

  create({ resource: 'product', values: processedValues });
};
```

**Note:** The generate-module script automatically includes this conversion for generated modules.

---

### Error 7: Update Operation - ID Field Error

**Symptom:**

```
Invalid input: expected string, received undefined
Path: ["data", "id"]
```

**Cause:**
The update schema includes `id` field in the data, but tRPC helper already wraps it as `{ id, data, ... }`.

**Solution:**

1. **Remove `id` from updateInput schema:**

```typescript
// ❌ WRONG
updateInput: z.object({
  id: z.string(), // Don't include id here
  name: z.string().optional(),
});

// ✅ CORRECT
updateInput: z.object({
  // id is handled by tRPC helper wrapper
  name: z.string().optional(),
});
```

2. **Remove `id` from form values before submitting:**

```typescript
const handleSubmit = async () => {
  const values = await form.validateFields();
  const { id, ...dataValues } = values; // Remove id
  update({ resource: 'product', id: editingRecord.id, values: dataValues });
};
```

---

### Error 8: Update Operation - Null Values for Optional Fields

**Symptom:**

```
Invalid input: expected string, received null
Path: ["data", "description"]
```

**Cause:**
Forms send `null` for empty optional fields, but Zod schema expects `string`.

**Solution:**
Make optional string fields nullable in update schema:

```typescript
updateInput: z.object({
  description: z.string().nullable().optional(), // Accept null
});
```

---

### Error 9: tRPC Procedure Not Found

**Symptom:**

```
No such procedure in router: product.createOne
```

(Note: Error shows the wrong procedure name that was called)

**Solution:**
The correct tRPC procedure names are `create`, `update`, `delete` (NO `One` suffix):

```typescript
// ❌ WRONG - with One suffix
product.createOne.mutate();
product.updateOne.mutate();
product.deleteOne.mutate();

// ✅ CORRECT - without One suffix
product.create.mutate(); // ← Correct
product.update.mutate(); // ← Correct
product.delete.mutate(); // ← Correct
product.getMany.query();
product.getOne.query();
product.deleteMany.mutate();
```

**Remember:**

- All tRPC procedures use `create`, `update`, `delete` (NO `One` suffix)
- This is a unified naming convention across createCrudRouter, tRPC, and Refine

---

## Development Tips

1. **Always dry-run first:** Use `--dry-run` to preview changes
2. **Check existing modules:** Look at `apps/api/src/modules/order/` for reference
3. **Verify routes:** Ensure all new routes are inside AdminLayout
4. **Create module index.ts:** Don't forget this file for each module
5. **Test tRPC connection:** Visit `http://localhost:3000/trpc` to see available procedures
6. **Handle numeric fields:** Convert string to number before submitting (Input type="number" returns string)
7. **Remove id from form values:** Use `const { id, ...dataValues } = values` to exclude id
8. **Make optional strings nullable:** Use `.nullable().optional()` for update schemas
9. **Module names:** Only lowercase letters, numbers, and hyphens (e.g., `coupon-template`)
10. **Reserved names:** Cannot use: admin, auth, user, role, permission, upload, payment, wechat, agents, config, system
11. **Duplicate prevention:** The script will refuse to regenerate an existing module — use `/deleteModule` first

---

### Error 10: Module Already Exists

**Symptom:**

```
❌ 模块 "Product" 已存在！
  已存在的部分：
    - Prisma schema (model Product)
    - tRPC router (...)
```

**Solution:**
Either use a different module name, or delete the existing module first:

```bash
/deleteModule product
```

---

### Error 11: Invalid Module Name

**Symptom:**

```
模块名 "123product" 不合法：只能包含小写字母、数字和连字符，且以字母开头
```

**Solution:**
Module names must start with a letter and contain only lowercase letters, numbers, and hyphens:

```bash
# ❌ WRONG
generate-module 123product
generate-module Product
generate-module product_name

# ✅ CORRECT
generate-module product
generate-module coupon-template
```

---

### Error 12: Project Structure Incomplete

**Symptom:**

```
项目结构不完整，缺少以下文件：
  - apps/admin/src/App.tsx
```

**Solution:**
Make sure you're running the script from the correct project root directory. The script expects the standard scaffold directory structure.

---

## Quick Reference Checklist

### Schema Checklist

- [ ] Prisma schema added to `infra/database/prisma/schema.prisma`
  - [ ] REST 模块含 `userId String?`（数据隔离）与 `createdById`/`updatedById`（审计，createCrudRouter 注入）
- [ ] Migration run: `npx prisma migrate dev`（随后 `npx prisma generate`）
- [ ] Zod schemas added to `infra/shared/src/index.ts`
  - [ ] updateInput does NOT include `id` field
  - [ ] Optional string fields use `.nullable().optional()`
- [ ] Permission registered in `infra/shared/src/permissions/registry.ts`
- [ ] `pnpm --filter @loom/shared build` 重建 dist

### Backend Checklist

- [ ] tRPC router created with correct import paths
  - [ ] Use relative path: `../../../trpc/trpc.helper`
  - [ ] Use `@loom/shared` for schema imports
- [ ] tRPC router registered in `apps/api/src/trpc/app.router.ts`
- [ ] Router spec 可跑：`npx vitest run src/modules/<name>/trpc/<name>.router.spec.ts`
- [ ] REST Controller（外部端模块）：`/api/<plural>` 五端点 + JwtAuthGuard + userId 隔离
- [ ] REST Controller 注册进 NestJS `module.ts` 的 controllers
- [ ] NestJS module 注册进 `app.module.ts`
- [ ] curl 冒烟：登录 → CRUD → 无 token 401

### Admin Checklist

- [ ] `StandardListPage` 列表页（行操作含 详情/编辑/删除）
- [ ] `StandardForm` 表单（FieldDefinition[] 声明式 + 枚举字典导出）
- [ ] `StandardDetailPage` 详情页（Detail 字段配置 + statusConfig）
- [ ] 组件 barrel（`components/index.ts`）与模块 barrel（`index.ts`）
- [ ] App.tsx（import + resource + list/detail 路由）、AdminLayout.tsx 菜单
- [ ] 资源名与 tRPC 路由一致

### Web Client Checklist

- [ ] `apps/web/src/lib/api/<camel>.ts`（wire 类型 + 枚举字典 + xxxApi）
- [ ] web `tsc` 全绿（页面按项目手写，import client 使用）

---

## Agent 协作

genModule 自动生成标准 CRUD 模块（覆盖 80% 工作量）。对于复杂业务需求，建议使用专业 Agent 精修定制部分。

### 工作流

```
1. /genModule <name>          → 生成基础 CRUD 模块
2. 用专业 Agent 精修定制部分   → 添加自定义业务逻辑
```

### 可用 Agent

| Agent                       | 适用场景                                                                     |
| --------------------------- | ---------------------------------------------------------------------------- |
| `nestjs-refine-trpc-expert` | 后端定制：自定义 tRPC procedure、复杂查询、Service 业务逻辑、REST Controller |
| `antdesign-crud-designer`   | 前端定制：复杂 UI 页面、自定义表单组件、详情页设计                           |

### 典型场景

- **genModule 生成后需要自定义 procedure**：用 `nestjs-refine-trpc-expert` 在 `createCrudRouter` 基础上添加自定义 procedure
- **需要复杂前端页面（看板、图表、向导表单）**：用 `antdesign-crud-designer` 替换或增强生成的列表页
- **完全定制模块（非标准 CRUD）**：直接用 `nestjs-refine-trpc-expert` 从零构建，跳过 genModule
