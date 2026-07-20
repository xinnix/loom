import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './trpc';
import { SearchSchema, FilterSchema, FilterCondition } from './search-filter.types';
import { buildWhereClause } from './search-filter.builder';

// Re-export protectedProcedure for use in routers
export { protectedProcedure };

/**
 * Service interface that can be injected into createCrudRouter.
 * Matches the method signatures of BaseService for seamless integration.
 *
 * When a service is provided, CRUD operations delegate to the service methods
 * instead of accessing ctx.prisma directly. This enables:
 * - Lifecycle hooks (beforeCreate, afterCreate, etc.)
 * - Custom business logic in service methods
 * - Consistent error handling
 *
 * @see BaseService in apps/api/src/common/base.service.ts
 */
export interface CrudService<T = any> {
  list(args?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  }): Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;

  getOne(id: string, options?: { include?: any; select?: any }): Promise<T | null>;

  create(data: any, options?: { userId?: string; include?: any; select?: any }): Promise<T>;

  update(
    id: string,
    data: any,
    options?: { userId?: string; include?: any; select?: any },
  ): Promise<T>;

  remove(id: string): Promise<T>;

  removeMany(ids: string[]): Promise<{ count: number }>;
}

/**
 * Configuration options for createCrudRouter
 */
export interface CrudRouterOptions {
  /** Include getMany procedure */
  includeGetMany?: boolean;
  /** Include getOne procedure */
  includeGetOne?: boolean;
  /** Include create procedure */
  includeCreate?: boolean;
  /** Include update procedure */
  includeUpdate?: boolean;
  /** Include delete procedure */
  includeDelete?: boolean;
  /** Include deleteMany procedure */
  includeDeleteMany?: boolean;
  /** Require authentication for getMany */
  protectedGetMany?: boolean;
  /** Require authentication for getOne */
  protectedGetOne?: boolean;
  /** Require authentication for create */
  protectedCreate?: boolean;
  /** Require authentication for update */
  protectedUpdate?: boolean;
  /** Require authentication for delete */
  protectedDelete?: boolean;
  /** Require authentication for deleteMany */
  protectedDeleteMany?: boolean;
  /** Fields to search when `search.keyword` is provided in getMany */
  searchFields?: string[];
  /** Fields that are allowed in filter conditions (whitelist for security) */
  filterableFields?: string[];
}

/**
 * Default schemas for CRUD operations
 */
const defaultGetManySchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  skip: z.number().optional(),
  take: z.number().optional(),
  where: z.any().optional(),
  orderBy: z.any().optional(),
  include: z.any().optional(),
  select: z.any().optional(),
});

// Extended getMany schema with search and filter support
const searchFilterGetManySchema = defaultGetManySchema.extend({
  search: SearchSchema.optional(),
  filter: FilterSchema,
});

const defaultGetOneSchema = z.object({
  id: z.string(),
  include: z.any().optional(),
  select: z.any().optional(),
});

const defaultDeleteOneSchema = z.object({
  id: z.string(),
});

const defaultDeleteManySchema = z.object({
  ids: z.array(z.string()),
});

/**
 * Creates a complete tRPC router with standard CRUD procedures.
 *
 * Uses the Prisma client from tRPC context (ctx.prisma) for database operations.
 *
 * @template TModelName - The Prisma model name (e.g., 'Todo', 'User', 'Post')
 *
 * @param modelName - The Prisma model name (capitalized, as defined in schema)
 * @param schemas - Zod schemas for validation
 * @param options - Optional configuration to include/exclude procedures
 *
 * @returns A tRPC router with CRUD procedures
 *
 * @example
 * ```typescript
 * import { createCrudRouter } from './trpc.helper';
 * import { TodoSchema } from '@loom/shared';
 *
 * export const todoRouter = createCrudRouter('Todo', {
 *   create: TodoSchema.createInput,
 *   update: TodoSchema.updateInput,
 * });
 *
 * // With search and filter support
 * export const productRouter = createCrudRouter('Product', {
 *   create: ProductSchema.createInput,
 *   update: ProductSchema.updateInput,
 * }, {
 *   searchFields: ['name', 'description'],
 *   filterableFields: ['isActive', 'categoryId', 'price'],
 * });
 * ```
 */
export const createCrudRouter = <TModelName extends string>(
  modelName: TModelName,
  schemas: {
    /** Schema for creating a record (used for create input.data) */
    create?: z.ZodTypeAny;
    /** Schema for updating a record (used for update input.data) */
    update?: z.ZodTypeAny;
    /** Schema for getting many records (optional, uses default if not provided) */
    getMany?: z.ZodTypeAny;
    /** Schema for getting one record (optional, uses default if not provided) */
    getOne?: z.ZodTypeAny;
  },
  options: CrudRouterOptions = {},
  service?: CrudService,
) => {
  const {
    includeGetMany = true,
    includeGetOne = true,
    includeCreate = true,
    includeUpdate = true,
    includeDelete = true,
    includeDeleteMany = true,
    protectedGetMany = false,
    protectedGetOne = false,
    protectedCreate = false,
    protectedUpdate = false,
    protectedDelete = false,
    protectedDeleteMany = false,
  } = options;

  const hasSearchFilter = !!(options.searchFields?.length || options.filterableFields?.length);

  const procedures: Record<string, any> = {};

  /**
   * Convert foreign key fields to Prisma relation connect syntax
   * e.g., { parentId: "xxx" } -> { parent: { connect: { id: "xxx" } } }
   *
   * Only transforms specific hierarchical fields like parentId, departmentId, etc.
   * Does NOT transform audit fields like createdById, updatedById.
   * Handles null/undefined/empty string by preserving the value for proper Prisma handling.
   */
  const transformRelationFields = (data: any, prisma: any): any => {
    // Read relation fields from Prisma DMMF for dynamic detection
    const dmmf = prisma?._dmmf;
    const modelInfo = dmmf?.modelMap?.[modelName];
    const relationFieldNames: string[] =
      modelInfo?.fields
        ?.filter((f: any) => f.relationName && f.kind === 'object')
        ?.map((f: any) => f.name) || [];
    const relationForeignKeyFields = new Set(relationFieldNames.map((name: string) => name + 'Id'));

    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip null, undefined, or empty string values - let Prisma handle them directly
      if (value === null || value === undefined || value === '') {
        result[key] = value;
        continue;
      }
      // Only transform relation FK fields with valid values
      if (relationForeignKeyFields.has(key)) {
        // Convert parentId -> parent, departmentId -> department, etc.
        const relationName = key.charAt(0).toLowerCase() + key.slice(1, -2);
        result[relationName] = { connect: { id: value } };
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  // getMany - List records with pagination, search, and filter
  if (includeGetMany) {
    const procedure = protectedGetMany ? protectedProcedure : publicProcedure;
    const getManySchema = hasSearchFilter ? searchFilterGetManySchema : defaultGetManySchema;

    procedures.getMany = procedure
      .input(schemas.getMany || getManySchema)
      .query(async ({ ctx, input }) => {
        const parsedInput = (schemas.getMany || getManySchema).safeParse(input);
        if (!parsedInput.success) {
          throw parsedInput.error;
        }
        const data = parsedInput.data as any;

        // Determine default orderBy: prefer createdAt desc, fallback to id desc
        const dmmfInfo = (ctx.prisma as any)?._dmmf;
        const modelDmmf = dmmfInfo?.modelMap?.[modelName];
        const hasCreatedAt = modelDmmf?.fields?.some((f: any) => f.name === 'createdAt');
        const defaultOrderBy = hasCreatedAt
          ? { createdAt: 'desc' as const }
          : { id: 'desc' as const };

        // Build where clause with search + filter support
        let where = data.where;
        if (hasSearchFilter) {
          // Filter by whitelist if filterableFields is configured
          let filters: FilterCondition[] | undefined = data.filter;
          if (options.filterableFields?.length && filters) {
            filters = filters.filter((f: FilterCondition) =>
              options.filterableFields!.includes(f.field),
            );
          }

          where = buildWhereClause({
            existingWhere: data.where,
            searchKeyword: data.search?.keyword,
            searchFields: data.search?.fields ?? options.searchFields,
            filters,
          });
        }

        const skip = data.skip ?? (data.page ? (data.page - 1) * (data.limit || 10) : 0);
        const take = data.take ?? data.limit;

        // If a service is provided, delegate to its list method
        if (service) {
          const result = await service.list({
            skip,
            take,
            where,
            orderBy: data.orderBy ?? defaultOrderBy,
            include: data.include,
            select: data.select,
          });
          return {
            items: result.data,
            total: result.total,
            page: result.page ?? data.page ?? 1,
            pageSize: result.pageSize ?? data.limit ?? 10,
            totalPages: result.totalPages ?? Math.ceil(result.total / (data.limit || 10)),
          };
        }

        // Legacy path: use ctx.prisma directly
        const model = (ctx.prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];

        const [items, total] = await Promise.all([
          model.findMany({
            skip,
            take,
            where,
            orderBy: data.orderBy ?? defaultOrderBy,
            include: data.include,
            select: data.select,
          }),
          model.count({ where }),
        ]);

        return {
          items,
          total,
          page: data.page || 1,
          pageSize: data.limit || 10,
          totalPages: Math.ceil(total / (data.limit || 10)),
        };
      });
  }

  // getOne - Get a single record by ID
  if (includeGetOne) {
    const procedure = protectedGetOne ? protectedProcedure : publicProcedure;
    procedures.getOne = procedure
      .input(schemas.getOne || defaultGetOneSchema)
      .query(async ({ ctx, input }) => {
        const parsedInput = (schemas.getOne || defaultGetOneSchema).safeParse(input);
        if (!parsedInput.success) {
          throw parsedInput.error;
        }
        const data = parsedInput.data as any;

        if (service) {
          return service.getOne(data.id, {
            include: data.include,
            select: data.select,
          });
        }

        const model = (ctx.prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        return model.findUnique({
          where: { id: data.id },
          include: data.include,
          select: data.select,
        });
      });
  }

  // create - Create a new record
  if (includeCreate) {
    const procedure = protectedCreate ? protectedProcedure : publicProcedure;
    const createInputSchema = z.object({
      data: schemas.create || z.any(),
      include: z.any().optional(),
      select: z.any().optional(),
    });

    procedures.create = procedure.input(createInputSchema).mutation(async ({ ctx, input }) => {
      const parsedInput = createInputSchema.safeParse(input);
      if (!parsedInput.success) {
        throw parsedInput.error;
      }
      const data = parsedInput.data as any;

      // Transform foreign key fields to relation connect syntax
      const createData = transformRelationFields(data.data, ctx.prisma);

      if (service) {
        return service.create(createData, {
          userId: (ctx as any).user?.id,
          include: data.include,
          select: data.select,
        });
      }

      const model = (ctx.prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
      // Inject userId if available in context (these are plain FK fields, not relations)
      if ((ctx as any).user?.id) {
        createData.createdById = (ctx as any).user.id;
        createData.updatedById = (ctx as any).user.id;
      }

      return model.create({
        data: createData,
        include: data.include,
        select: data.select,
      });
    });
  }

  // update - Update an existing record
  if (includeUpdate) {
    const procedure = protectedUpdate ? protectedProcedure : publicProcedure;
    const updateInputSchema = z.object({
      id: z.string(),
      data: schemas.update || schemas.create || z.any(),
      include: z.any().optional(),
      select: z.any().optional(),
    });

    procedures.update = procedure.input(updateInputSchema).mutation(async ({ ctx, input }) => {
      const parsedInput = updateInputSchema.safeParse(input);
      if (!parsedInput.success) {
        throw parsedInput.error;
      }
      const data = parsedInput.data as any;

      // Transform foreign key fields to relation connect syntax
      const updateData = transformRelationFields(data.data, ctx.prisma);

      if (service) {
        return service.update(data.id, updateData, {
          userId: (ctx as any).user?.id,
          include: data.include,
          select: data.select,
        });
      }

      const model = (ctx.prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
      // Inject userId if available in context (these are plain FK fields, not relations)
      // Only add updatedById if the model has this field
      if ((ctx as any).user?.id) {
        // Check if model has updatedById field before adding it
        // Models like Department don't have this field
        const dmmf = (ctx.prisma as any)._dmmf;
        if (dmmf && dmmf.modelMap) {
          const modelInfo = dmmf.modelMap[modelName];
          if (modelInfo && modelInfo.fields && modelInfo.fields.updatedById) {
            updateData.updatedById = (ctx as any).user.id;
          }
        }
      }

      return model.update({
        where: { id: data.id },
        data: updateData,
        include: data.include,
        select: data.select,
      });
    });
  }

  // delete - Delete a single record
  if (includeDelete) {
    const procedure = protectedDelete ? protectedProcedure : publicProcedure;
    procedures.delete = procedure.input(defaultDeleteOneSchema).mutation(async ({ ctx, input }) => {
      if (service) {
        return service.remove(input.id);
      }
      const model = (ctx.prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
      return model.delete({
        where: { id: input.id },
      });
    });
  }

  // deleteMany - Delete multiple records
  if (includeDeleteMany) {
    const procedure = protectedDeleteMany ? protectedProcedure : publicProcedure;
    procedures.deleteMany = procedure
      .input(defaultDeleteManySchema)
      .mutation(async ({ ctx, input }) => {
        if (service) {
          return service.removeMany(input.ids);
        }
        const model = (ctx.prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        return model.deleteMany({
          where: { id: { in: input.ids } },
        });
      });
  }

  return router(procedures);
};

/**
 * Creates a minimal tRPC router with only read procedures.
 *
 * @param modelName - The Prisma model name
 * @param schemas - Zod schemas for validation
 * @returns A tRPC router with read-only procedures
 */
export const createReadOnlyRouter = <TModelName extends string>(
  modelName: TModelName,
  schemas?: {
    getMany?: z.ZodTypeAny;
    getOne?: z.ZodTypeAny;
  },
  service?: CrudService,
) => {
  return createCrudRouter<TModelName>(
    modelName,
    schemas || {},
    {
      includeCreate: false,
      includeUpdate: false,
      includeDelete: false,
      includeDeleteMany: false,
    },
    service,
  );
};

/**
 * Creates a tRPC router with additional custom procedures.
 *
 * Use this when you need standard CRUD plus custom procedures.
 *
 * @example
 * ```typescript
 * export const todoRouter = createCrudRouterWithCustom(
 *   'Todo',
 *   { create: TodoSchema.createInput },
 *   (t) => ({
 *     toggleComplete: t.procedure
 *       .input(z.object({ id: z.string() }))
 *       .mutation(async ({ ctx, input }) => {
 *         // Custom logic using ctx.prisma
 *         const todo = await ctx.prisma.todo.update({
 *           where: { id: input.id },
 *           data: { isCompleted: true },
 *         });
 *         return todo;
 *       }),
 *   })
 * );
 * ```
 */
export const createCrudRouterWithCustom = <TModelName extends string>(
  modelName: TModelName,
  schemas: {
    create?: z.ZodTypeAny;
    update?: z.ZodTypeAny;
    getMany?: z.ZodTypeAny;
    getOne?: z.ZodTypeAny;
  },
  customProcedures: (t: typeof publicProcedure) => Record<string, any>,
  options: CrudRouterOptions = {},
  service?: CrudService,
) => {
  const crudRouter = createCrudRouter<TModelName>(modelName, schemas, options, service);
  const custom = customProcedures(publicProcedure);
  return router({
    ...crudRouter._def.procedures,
    ...custom,
  });
};
