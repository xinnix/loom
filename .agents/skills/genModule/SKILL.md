---
name: genModule
description: Rapidly generates full-stack CRUD modules from database schema to frontend management pages. Use when creating new modules with standard CRUD operations for: (1) Business entities like products, orders, articles, todos, users, categories, (2) Any resource requiring list, create, edit, delete functionality, (3) Quick prototyping and MVP development. Supports smart field analysis for 10+ business patterns, file upload capabilities, and complete CRUD functionality.
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

For rapid development, use the automated generator script:

```bash
# Smart analysis (recommended - detects business patterns automatically)
node .Codex/skills/genModule/scripts/generate-module.ts product

# Preview mode (no changes made)
node .Codex/skills/genModule/scripts/generate-module.ts todo --dry-run

# With file upload support
node .Codex/skills/genModule/scripts/generate-module.ts article --file-upload
```

**What it generates:**

- Database: Prisma schema with migration
- Backend: tRPC router with factory function
- Frontend: List and Create pages
- Auto-registration: Updates App.tsx and app.router.ts

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
  - [ ] Use `@loom/shared` for schema imports
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
