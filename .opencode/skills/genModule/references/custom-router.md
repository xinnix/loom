# Custom Router Patterns

When you need business logic beyond standard CRUD, use custom router implementation.

## When to Use Custom Router

- Complex validation logic
- Business rule enforcement
- Data transformation before save
- Integration with external services
- Multi-step operations
- Custom query logic

## Custom Router Template

**Location:** `apps/api/src/modules/[module]/trpc/[module].router.ts`

```typescript
import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const customModuleRouter = router({
  // Standard CRUD with custom logic
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 10, ...where } = input;

      // Custom filter logic
      const filter: any = {};
      if (where.status) {
        filter.status = where.status;
      }

      const [items, total] = await Promise.all([
        ctx.prisma.customModule.findMany({
          where: filter,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.customModule.count({ where: filter }),
      ]);

      return {
        items,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // Custom create with validation
  createOne: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        email: z.string().email(),
        customField: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Business logic: Check if email already exists
      const existing = await ctx.prisma.customModule.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }

      // Transform data before save
      const data = {
        ...input,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        createdById: ctx.user.id,
      };

      return ctx.prisma.customModule.create({ data });
    }),

  // Custom update with state transition
  updateOne: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['draft', 'pending', 'approved', 'rejected']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;

      // Business rule: Can only approve pending items
      const current = await ctx.prisma.customModule.findUnique({
        where: { id },
      });

      if (!current) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Item not found',
        });
      }

      if (status === 'approved' && current.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only approve pending items',
        });
      }

      return ctx.prisma.customModule.update({
        where: { id },
        data: {
          status,
          approvedById: ctx.user.id,
          approvedAt: new Date(),
        },
      });
    }),

  // Custom procedure: Bulk operations
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        updates: z.object({
          status: z.enum(['active', 'inactive']),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.customModule.updateMany({
        where: { id: { in: input.ids } },
        data: input.updates,
      });

      return {
        success: true,
        count: result.count,
      };
    }),

  // Custom procedure: Statistics/Aggregation
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, inactive] = await Promise.all([
      ctx.prisma.customModule.count(),
      ctx.prisma.customModule.count({ where: { status: 'active' } }),
      ctx.prisma.customModule.count({ where: { status: 'inactive' } }),
    ]);

    return { total, active, inactive };
  }),
});
```

## Common Patterns

### 1. Soft Delete

```typescript
deleteOne: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.customModule.update({
      where: { id: input.id },
      data: {
        deletedAt: new Date(),
        deletedById: ctx.user.id,
      },
    });
  }),
```

### 2. Audit Trail

```typescript
createOne: protectedProcedure
  .input(createSchema)
  .mutation(async ({ ctx, input }) => {
    const data = {
      ...input,
      createdById: ctx.user.id,
      updatedById: ctx.user.id,
    };

    const record = await ctx.prisma.customModule.create({ data });

    // Log to audit table
    await ctx.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'CustomModule',
        entityId: record.id,
        userId: ctx.user.id,
      },
    });

    return record;
  }),
```

### 3. Relationships with Include

```typescript
getOne: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.prisma.customModule.findUnique({
      where: { id: input.id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        comments: {
          where: { deletedAt: null },
          include: { user: true },
        },
      },
    });
  }),
```

### 4. Search with Full Text

```typescript
getMany: protectedProcedure
  .input(z.object({
    search: z.string().optional(),
    page: z.number(),
    limit: z.number(),
  }))
  .query(async ({ ctx, input }) => {
    const where = input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
          ],
        }
      : {};

    // ... rest of implementation
  }),
```

## Combining with Factory Function

You can extend the factory function with custom procedures:

```typescript
import { createCrudRouterWithCustom } from '@shared/trpc/trpc.helper';

export const hybridRouter = createCrudRouterWithCustom(
  'CustomModule',
  { create: createSchema, update: updateSchema },
  (t) => ({
    // Custom procedures
    publish: t.procedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      return ctx.prisma.customModule.update({
        where: { id: input.id },
        data: { status: 'published' },
      });
    }),
    archive: t.procedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      return ctx.prisma.customModule.update({
        where: { id: input.id },
        data: { status: 'archived' },
      });
    }),
  }),
);
```
