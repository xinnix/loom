import { Prisma } from '@loom/database';

let currentUserId: string | undefined;

export function setCurrentUserId(id: string | undefined) {
  currentUserId = id;
}

export function auditExtension() {
  return Prisma.defineExtension({
    name: 'audit',
    query: {
      $allModels: {
        async create({ args, query }) {
          if (currentUserId && args.data) {
            if (typeof args.data === 'object' && !Array.isArray(args.data)) {
              (args.data as any).createdById ??= currentUserId;
              (args.data as any).updatedById ??= currentUserId;
            }
          }
          return query(args);
        },
        async update({ args, query }) {
          if (currentUserId && args.data) {
            if (typeof args.data === 'object' && !Array.isArray(args.data)) {
              (args.data as any).updatedById = currentUserId;
            }
          }
          return query(args);
        },
      },
    },
  });
}
