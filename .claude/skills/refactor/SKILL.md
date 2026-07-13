---
name: refactor
description: Refactor existing modules to use scaffold abstractions (BaseService, createCrudRouter, StandardListPage, StandardForm). Automatically transforms manual CRUD code into standardized patterns while preserving custom business logic. Use after /analyze to apply refactoring recommendations.
allowed-tools:
  - Bash(node:*)
  - Bash(tsx:*)
  - Bash(npx:*)
  - Bash(cat:*)
  - Bash(find:*)
  - Bash(grep:*)
  - Bash(wc:*)
  - Bash(head:*)
---

# /refactor Skill - Module Refactoring

Refactor an existing module to use scaffold abstraction layers. This skill reads the module code, identifies manual CRUD patterns, and replaces them with standardized abstractions.

## Automated Refactoring (Script)

For fast standardized refactoring:

```bash
# Preview refactoring plan
node .claude/skills/refactor/scripts/refactor-module.ts <module-name> --dry-run

# Apply refactoring
node .claude/skills/refactor/scripts/refactor-module.ts <module-name>

# Backend or frontend only
node .claude/skills/refactor/scripts/refactor-module.ts <module-name> --backend-only
node .claude/skills/refactor/scripts/refactor-module.ts <module-name> --frontend-only
```

The script uses analyze-module.ts output to plan and execute the refactoring while preserving custom business logic.

## Usage

```
/refactor <module-name>
/refactor <module-name> --backend-only
/refactor <module-name> --frontend-only
/refactor <module-name> --dry-run
```

After running the script, Claude can continue with additional manual adjustments for complex cases.

---

## Pre-flight: Run Analysis First

Before refactoring, read the module files to understand what needs to change:

```bash
# Quick check
grep -l "BaseService" apps/api/src/modules/<name>/services/*.ts || echo "NEEDS BaseService refactor"
grep -l "createCrudRouter" apps/api/src/modules/<name>/trpc/*.ts || echo "NEEDS createCrudRouter refactor"
grep -l "StandardListPage" apps/admin/src/modules/<name>/**/*.tsx || echo "NEEDS StandardListPage refactor"
```

---

## Refactoring Steps

### Step 1: Refactor Backend Service → BaseService

**Before (Manual CRUD):**

```typescript
@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async findMany(params: { page?: number; limit?: number; where?: any }) {
    const { page = 1, limit = 10, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.merchant.findMany({ where, skip, take: limit }),
      this.prisma.merchant.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    return this.prisma.merchant.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.merchant.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.merchant.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.merchant.delete({ where: { id } });
  }
}
```

**After (BaseService):**

```typescript
import { BaseService } from './base.service';

@Injectable()
export class MerchantService extends BaseService<'Merchant'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Merchant');
  }

  // All basic CRUD methods inherited from BaseService
  // Only add custom business logic below

  // Example: custom method with business logic
  async findActiveMerchants() {
    return this.findMany({ where: { status: 'ACTIVE' } });
  }
}
```

**Key changes:**

- Extend `BaseService<'ModelName'>` instead of manual implementation
- Constructor passes `prisma` and model name to super
- Keep only custom business methods
- CRUD methods (findMany, findOne, create, update, delete) inherited automatically

### Step 2: Refactor tRPC Router → createCrudRouter

**Before (Manual Router):**

```typescript
import { publicProcedure } from '../../trpc/trpc.helper';
import { z } from 'zod';

export const merchantRouter = router({
  getMany: publicProcedure
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.merchant.findMany({ ... });
    }),
  getOne: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.merchant.findUnique({ where: { id: input.id } });
    }),
  create: publicProcedure
    .input(MerchantSchema.createInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.merchant.create({ data: input });
    }),
  // ... more procedures
});
```

**After (createCrudRouter):**

```typescript
import { createCrudRouter } from '../../../trpc/trpc.helper';
import { MerchantSchema } from '@roundtable/shared';

export const merchantRouter = createCrudRouter('Merchant', {
  create: MerchantSchema.createInput,
  update: MerchantSchema.updateInput,
  getMany: MerchantSchema.getManyInput,
  getOne: MerchantSchema.getOneInput,
});
```

**Key changes:**

- Replace entire router with one `createCrudRouter` call
- All CRUD procedures generated automatically
- Custom procedures can be merged in if needed

**If the router has custom procedures:**

```typescript
import { createCrudRouter, mergeRouters } from '../../../trpc/trpc.helper';

const crudRouter = createCrudRouter('Merchant', {
  /* schemas */
});

export const merchantRouter = mergeRouters(
  crudRouter,
  router({
    // Custom procedures preserved
    getActive: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.merchant.findMany({ where: { status: 'ACTIVE' } });
    }),
  }),
);
```

### Step 3: Refactor Frontend List Page → StandardListPage

**Before (Manual List Page):**

```typescript
export const MerchantListPage = () => {
  const { result, query } = useList({ resource: "merchant", ... });
  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  // ... 100+ lines of manual implementation
  const columns = [
    { title: "名称", dataIndex: "name" },
    { title: "状态", dataIndex: "status" },
    // ...
  ];

  return (
    <div>
      <Table columns={columns} dataSource={result?.data} />
      <Modal ...>
        <Form form={form}>...</Form>
      </Modal>
    </div>
  );
};
```

**After (StandardListPage):**

```typescript
import { StandardListPage } from "../../shared/components/StandardListPage";
import { StandardForm } from "../../shared/components/StandardForm";
import type { FieldDefinition } from "../../shared/components/StandardForm/types";

const fields: FieldDefinition[] = [
  { key: "name", label: "名称", type: "text", rules: [{ required: true }] },
  { key: "status", label: "状态", type: "select",
    options: [
      { label: "活跃", value: "ACTIVE" },
      { label: "停用", value: "INACTIVE" },
    ]
  },
  { key: "description", label: "描述", type: "textarea" },
];

const columns = [
  { title: "名称", dataIndex: "name" },
  { title: "状态", dataIndex: "status",
    render: (status: string) => <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
  },
];

export const MerchantListPage = () => (
  <StandardListPage
    resource="merchant"
    title="商户管理"
    columns={columns}
    formComponent={(props) => <StandardForm {...props} fields={fields} />}
  />
);
```

**Key changes:**

- Replace manual Modal/Table/Form with StandardListPage
- Define columns and fields as config
- Pass StandardForm as formComponent
- ~80% less code

### Step 4: Refactor Zod Schemas (Add Smart Validation)

Read current schemas from `infra/shared/src/index.ts` and enhance with smart validation:

```typescript
// Before: Basic schemas
merchantSchema.createInput: z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string(),
})

// After: Smart validation
merchantSchema.createInput: z.object({
  name: z.string().min(1, "不能为空"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
  email: z.string().email("邮箱格式不正确"),
})
```

Apply the FIELD_INFERENCE_RULES from genModule for:

- Currency fields → `.min(0)`
- Email fields → `.email()`
- Phone fields → `.regex()`
- URL fields → `.url()`

---

## Refactoring Safety Rules

1. **Always backup custom logic**: If a service has custom methods beyond CRUD, keep them
2. **Preserve REST controllers**: REST endpoints for miniapp should remain unchanged
3. **Test after refactoring**: Run `pnpm dev` and verify the module still works
4. **One module at a time**: Don't refactor multiple modules simultaneously
5. **Check imports**: After refactoring, verify all import paths are correct

---

## Refactoring Report

After completing the refactoring, generate a report:

```markdown
# Refactoring Report: <ModuleName>

## Changes Made

### Backend Service

- Before: XXX lines
- After: XXX lines
- Reduction: XX%
- Custom methods preserved: [list]

### tRPC Router

- Before: XXX lines
- After: XXX lines
- Reduction: XX%
- Custom procedures preserved: [list]

### Frontend Pages

- Before: XXX lines
- After: XXX lines
- Reduction: XX%
- Custom UI preserved: [list]

### Zod Schemas

- Enhanced validations: [list fields]
- New validation rules: [count]

## Impact Summary

| Metric          | Before     | After | Change   |
| --------------- | ---------- | ----- | -------- |
| Total LOC       | XXX        | XXX   | -XX%     |
| Type Safety     | Partial    | Full  | +100%    |
| Maintainability | Low/Medium | High  | Improved |

## Files Changed

- [ ] apps/api/src/modules/<name>/services/<name>.service.ts
- [ ] apps/api/src/modules/<name>/trpc/<name>.router.ts
- [ ] apps/admin/src/modules/<name>/pages/<name>ListPage.tsx
- [ ] infra/shared/src/index.ts

## Verification Steps

1. Start dev server: `pnpm dev`
2. Navigate to the module page
3. Test CRUD operations: Create, Read, Update, Delete
4. Verify no console errors
```

---

## Scaffold Abstractions Quick Reference

| Abstraction        | Import Path                                  | One-liner                              |
| ------------------ | -------------------------------------------- | -------------------------------------- |
| BaseService        | `scaffold/backend/base.service.ts`           | `class X extends BaseService<'Model'>` |
| createCrudRouter   | `../../../trpc/trpc.helper`                  | `createCrudRouter('Model', schemas)`   |
| StandardListPage   | `../../shared/components/StandardListPage`   | `<StandardListPage resource="x" .../>` |
| StandardForm       | `../../shared/components/StandardForm`       | `<StandardForm fields={[...]} />`      |
| StandardDetailPage | `../../shared/components/StandardDetailPage` | `<StandardDetailPage .../>`            |
