---
name: genModule
description: Rapidly generates full-stack CRUD modules with smart field inference, auto relation detection, and intelligent UI pattern selection. Phase 2 enhanced with currency/email/phone/slug/image validation, belongsTo/TreeSelect relation generation, and modal/separate page auto-selection.
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

# Category (auto-detects parentId → TreeSelect)
node .claude/skills/genModule/scripts/generate-module.ts category
```

**What it generates:**

- Database: Prisma schema with relations
- Backend: tRPC router with factory function
- Frontend: List page with smart UI components
- Auto-registration: Updates App.tsx, app.router.ts, and AdminLayout.tsx

**Safety features:**

- Idempotency check: Refuses to regenerate an existing module
- Input validation: Validates module name format and reserved names
- Project structure validation: Checks required files exist
- Automatic rollback: Reverts all changes if any step fails
- Dry-run mode: Preview without writing files

**Phase 2 Smart Features:**

- Currency fields (price, amount) → InputNumber with ¥ formatter + min:0
- Email fields → email validation
- Phone fields → regex validation
- Slug fields → auto-generate + regex
- Image fields (avatar, cover) → OSSUpload
- Date fields → DatePicker with showTime
- Percent fields → InputNumber with % formatter
- Relation fields (\*Id) → Select/TreeSelect auto-detection
- UI pattern → auto-select modal vs separate pages

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
```

---

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
import { ProductSchema } from '@roundtable/shared';

export const productRouter = createCrudRouter('Product', {
  create: ProductSchema.createInput,
  update: ProductSchema.updateInput,
  getMany: ProductSchema.getManyInput,
  getOne: ProductSchema.getOneInput,
});
```

**⚠️ Important Notes:**

- Use **relative import path** `../../../trpc/trpc.helper` (NOT `@shared/trpc/trpc.helper`)
- Use **@roundtable/shared** for schema imports (NOT `@shared/index`)
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

**Step 4.4 - Create List Page:**

Use Modal pattern for create/edit (NOT separate Create/Edit pages):

```typescript
import { useList, useCreate, useUpdate } from "@refinedev/core";
import { List, DeleteButton } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag } from "antd";
import { useState } from "react";

export const ProductListPage = () => {
  const { result, query } = useList({ resource: "product", pagination: { pageSize: 10 } });
  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  // ... columns definition ...

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingRecord) {
      update({ resource: "product", id: editingRecord.id, values: values });
    } else {
      create({ resource: "product", values: values });
    }
  };

  return (
    <List>
      <Table columns={columns} dataSource={result?.data} />
      <Modal open={isModalVisible} onOk={handleSubmit}>
        <Form form={form}>{/* form fields */}</Form>
      </Modal>
    </List>
  );
};
```

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
```

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
import { ProductSchema } from '@roundtable/shared';
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
- [ ] Migration run: `npx prisma migrate dev`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Zod schemas added to `infra/shared/src/index.ts`
  - [ ] updateInput does NOT include `id` field
  - [ ] Optional string fields use `.nullable().optional()`

### Backend Checklist

- [ ] tRPC router created with correct import paths
  - [ ] Use relative path: `../../../trpc/trpc.helper`
  - [ ] Use `@roundtable/shared` for schema imports
- [ ] tRPC router registered in `apps/api/src/trpc/app.router.ts`
- [ ] Router uses correct parameter format: `(modelName, { create, update, getMany, getOne })`

### Frontend Checklist

- [ ] Frontend module `index.ts` created
- [ ] Frontend list page created with Modal pattern
- [ ] Form submission removes `id` field: `const { id, ...dataValues } = values`
- [ ] Numeric fields converted to number before submitting
- [ ] App.tsx updated with import, resource, and route (inside AdminLayout)
- [ ] AdminLayout.tsx updated with sidebar menu item
- [ ] Resource name matches between Refine and tRPC

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
