---
name: enum-sync
description: Sync Prisma enums to Zod schemas and frontend Select options. Run after adding or modifying enums in schema.prisma.
allowed-tools:
  - Bash(npx prisma:*)
  - Bash(pnpm -C :*)
---

# Enum Sync

## Overview

Generates Zod enum definitions and frontend Select option constants from Prisma schema `enum` declarations. Keeps validation (backend) and UI options (frontend) in sync with a single source of truth: `schema.prisma`.

## When to Use

After adding or modifying `enum` blocks in `infra/database/prisma/schema.prisma`.

## Instructions

1. Run the sync script: `npx tsx .claude/skills/enum-sync/scripts/enum-sync.ts`
2. Review the generated files:
   - `infra/shared/src/enums.ts` — Zod enum definitions
   - `apps/admin/src/shared/constants/enums.ts` — Select option arrays
3. Build shared package: `pnpm -C infra/shared build`

## Current Status

No Prisma enums exist in the schema yet. All enum-like fields use `String` type with comments.
This skill is ready for use when enums are added to `schema.prisma`.

## Example

After adding to schema.prisma:

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

The script generates:

**infra/shared/src/enums.ts:**

```typescript
export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
```

**apps/admin/src/shared/constants/enums.ts:**

```typescript
export const OrderStatusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '已确认', value: 'CONFIRMED' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已送达', value: 'DELIVERED' },
  { label: '已取消', value: 'CANCELLED' },
];
```
