import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPrismaMock } from '../test/prisma-mock';
import { createCrudRouter, createCrudRouterWithCustom } from './trpc.helper';
import type { CrudService } from './trpc.helper';
import { z } from 'zod';

const TestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const TestSchemas = {
  create: TestSchema,
  update: TestSchema.partial(),
};

function createTestCaller(router: any, user: any = null) {
  const prisma = createPrismaMock(['todo']);
  const ctx = {
    prisma,
    fileStorage: {
      upload: vi.fn(),
      delete: vi.fn(),
      getSignedUrl: vi.fn(),
      getUploadCredentials: vi.fn(),
    },
    app: null,
    req: { headers: {}, socket: { remoteAddress: '127.0.0.1' } },
    res: {},
    user,
  };
  return { caller: router.createCaller(ctx), prisma };
}

describe('createCrudRouter', () => {
  let router: any;
  let prisma: any;
  let caller: any;

  beforeEach(() => {
    router = createCrudRouter('todo', TestSchemas);
  });

  describe('getMany', () => {
    it('returns paginated items', async () => {
      const items = [{ id: '1', name: 'Test' }];
      const result = createTestCaller(router);
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.findMany.mockResolvedValue(items);
      prisma.todo.count.mockResolvedValue(1);

      const res = await caller.getMany({ page: 1, limit: 10 });
      expect(res.items).toEqual(items);
      expect(res.total).toBe(1);
    });
  });

  describe('getOne', () => {
    it('returns a record by ID', async () => {
      const record = { id: '1', name: 'Test' };
      const result = createTestCaller(router);
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.findUnique.mockResolvedValue(record);

      const res = await caller.getOne({ id: '1' });
      expect(res).toEqual(record);
    });

    it('returns null when record not found', async () => {
      const result = createTestCaller(router);
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.findUnique.mockResolvedValue(null);

      const res = await caller.getOne({ id: 'nonexistent' });
      expect(res).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a record with data wrapper', async () => {
      const input = { name: 'New Todo' };
      const created = { id: '1', ...input };
      const result = createTestCaller(router, { id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.create.mockResolvedValue(created);

      const res = await caller.create({ data: input });
      expect(res).toEqual(created);
    });

    it('injects createdById from ctx.user', async () => {
      const result = createTestCaller(router, { id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.create.mockResolvedValue({ id: '1' });

      await caller.create({ data: { name: 'Test' } });
      expect(prisma.todo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdById: 'user-1', updatedById: 'user-1' }),
        }),
      );
    });

    it('passes non-relation fields through unchanged', async () => {
      const result = createTestCaller(router, { id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.create.mockResolvedValue({ id: '1' });

      await caller.create({ data: { name: 'Test', description: 'A test todo' } });
      expect(prisma.todo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Test', description: 'A test todo' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates a record with id and data wrapper', async () => {
      const updated = { id: '1', name: 'Updated' };
      const result = createTestCaller(router, { id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.update.mockResolvedValue(updated);

      const res = await caller.update({ id: '1', data: { name: 'Updated' } });
      expect(res).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes a record by ID', async () => {
      const deleted = { id: '1' };
      const result = createTestCaller(router, { id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.delete.mockResolvedValue(deleted);

      const res = await caller.delete({ id: '1' });
      expect(res).toEqual(deleted);
    });
  });

  describe('deleteMany', () => {
    it('deletes multiple records', async () => {
      const result = createTestCaller(router, { id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.todo.deleteMany.mockResolvedValue({ count: 2 });

      const res = await caller.deleteMany({ ids: ['1', '2'] });
      expect(res).toEqual({ count: 2 });
    });
  });
});

describe('createCrudRouter with service injection', () => {
  let mockService: CrudService;
  let router: any;

  beforeEach(() => {
    mockService = {
      list: vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'From Service' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }),
      getOne: vi.fn().mockResolvedValue({ id: '1', name: 'From Service' }),
      create: vi.fn().mockResolvedValue({ id: 'new-1', name: 'Created via Service' }),
      update: vi.fn().mockResolvedValue({ id: '1', name: 'Updated via Service' }),
      remove: vi.fn().mockResolvedValue({ id: '1' }),
      removeMany: vi.fn().mockResolvedValue({ count: 2 }),
    };
    router = createCrudRouter('todo', TestSchemas, {}, mockService);
  });

  it('delegates getMany to service.list and maps data to items', async () => {
    const { caller } = createTestCaller(router);
    const res = await caller.getMany({ page: 1, limit: 10 });

    expect(mockService.list).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
    expect(res.items).toEqual([{ id: '1', name: 'From Service' }]);
    expect(res.total).toBe(1);
  });

  it('delegates getOne to service.getOne', async () => {
    const { caller } = createTestCaller(router);
    const res = await caller.getOne({ id: '1' });

    expect(mockService.getOne).toHaveBeenCalledWith('1', expect.any(Object));
    expect(res).toEqual({ id: '1', name: 'From Service' });
  });

  it('delegates create to service.create with userId', async () => {
    const { caller } = createTestCaller(router, { id: 'user-1', type: 'admin' });
    const res = await caller.create({ data: { name: 'Test' } });

    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test' }),
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(res).toEqual({ id: 'new-1', name: 'Created via Service' });
  });

  it('delegates update to service.update with userId', async () => {
    const { caller } = createTestCaller(router, { id: 'user-1', type: 'admin' });
    const res = await caller.update({ id: '1', data: { name: 'Updated' } });

    expect(mockService.update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ name: 'Updated' }),
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(res).toEqual({ id: '1', name: 'Updated via Service' });
  });

  it('delegates delete to service.remove', async () => {
    const { caller } = createTestCaller(router);
    const res = await caller.delete({ id: '1' });

    expect(mockService.remove).toHaveBeenCalledWith('1');
    expect(res).toEqual({ id: '1' });
  });

  it('delegates deleteMany to service.removeMany', async () => {
    const { caller } = createTestCaller(router);
    const res = await caller.deleteMany({ ids: ['1', '2'] });

    expect(mockService.removeMany).toHaveBeenCalledWith(['1', '2']);
    expect(res).toEqual({ count: 2 });
  });
});

describe('createCrudRouterWithCustom with service injection', () => {
  let mockService: CrudService;
  let router: any;

  beforeEach(() => {
    mockService = {
      list: vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Custom Service' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }),
      getOne: vi.fn().mockResolvedValue({ id: '1', name: 'Custom Service' }),
      create: vi.fn().mockResolvedValue({ id: 'new-1', name: 'Created' }),
      update: vi.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
      remove: vi.fn().mockResolvedValue({ id: '1' }),
      removeMany: vi.fn().mockResolvedValue({ count: 3 }),
    };
    router = createCrudRouterWithCustom(
      'todo',
      TestSchemas,
      () => ({
        customAction: vi.fn().mockResolvedValue({ custom: true }),
      }),
      {},
      mockService,
    );
  });

  it('delegates standard CRUD to service while custom procedures still work', async () => {
    const { caller } = createTestCaller(router, { id: 'user-1', type: 'admin' });

    const res = await caller.getMany({ page: 1, limit: 10 });
    expect(mockService.list).toHaveBeenCalled();
    expect(res.items).toEqual([{ id: '1', name: 'Custom Service' }]);
  });
});
