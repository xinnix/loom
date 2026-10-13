import { vi } from 'vitest';

export type MockDelegate = {
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  aggregate: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

function createModelMock(): MockDelegate {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  };
}

const DEFAULT_MODELS = [
  'admin',
  'user',
  'role',
  'permission',
  'adminRole',
  'adminRefreshToken',
  'userRefreshToken',
  'agent',
  'agentRun',
  'agentSession',
  'agentMessage',
  'llmConfig',
  'todo',
  'upload',
];

export function createPrismaMock(extraModels: string[] = []) {
  const prisma: Record<string, MockDelegate> = {};

  const allModels = [...new Set([...DEFAULT_MODELS, ...extraModels])];
  for (const name of allModels) {
    prisma[name] = createModelMock();
  }

  // 兼容两种形态：交互式 fn(prisma) 与数组式 Promise[]
  (prisma as any).$transaction = vi.fn(async (arg: any) =>
    Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
  );
  (prisma as any).$connect = vi.fn();
  (prisma as any).$disconnect = vi.fn();

  return prisma as any;
}

export function resetPrismaMock(prisma: any) {
  for (const key of Object.keys(prisma)) {
    if (typeof prisma[key] === 'object' && prisma[key] !== null) {
      for (const method of Object.keys(prisma[key])) {
        if (vi.isMockFunction(prisma[key][method])) {
          prisma[key][method].mockReset();
        }
      }
    }
  }
}

export function createCaller(router: any, ctxOverrides: Record<string, any> = {}): any {
  const extraModels = (ctxOverrides as any)._extraModels || [];
  const prisma = createPrismaMock(extraModels);
  const { _extraModels, ...restOverrides } = ctxOverrides as any;
  const ctx = {
    prisma,
    fileStorage: {
      upload: vi.fn(),
      delete: vi.fn(),
      getSignedUrl: vi.fn(),
      getUploadCredentials: vi.fn(),
      validateImageType: vi.fn(),
      validateVideoType: vi.fn(),
    },
    app: null,
    req: null,
    res: null,
    user: null,
    ...restOverrides,
  };

  return {
    caller: router.createCaller(ctx),
    ctx,
    prisma,
  };
}
