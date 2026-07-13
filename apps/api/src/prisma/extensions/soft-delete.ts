import { Prisma } from '@loom/database';

const SOFT_DELETE_MODELS = new Set(['Admin', 'User', 'Role', 'Permission']);

export function softDeleteExtension() {
  return Prisma.defineExtension({
    name: 'softDelete',
    query: {
      $allModels: {
        async findMany({ args, query, model }) {
          if (SOFT_DELETE_MODELS.has(model as string)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ args, query, model }) {
          if (SOFT_DELETE_MODELS.has(model as string)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findUnique({ args, query, model }) {
          if (SOFT_DELETE_MODELS.has(model as string)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async count({ args, query, model }) {
          if (SOFT_DELETE_MODELS.has(model as string)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async delete({ args, query, model }) {
          if (SOFT_DELETE_MODELS.has(model as string)) {
            const modelKey = (model as string).charAt(0).toLowerCase() + (model as string).slice(1);
            return (this as any)[modelKey].update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async deleteMany({ args, query, model }) {
          if (SOFT_DELETE_MODELS.has(model as string)) {
            const modelKey = (model as string).charAt(0).toLowerCase() + (model as string).slice(1);
            return (this as any)[modelKey].updateMany({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
      },
    },
  });
}
