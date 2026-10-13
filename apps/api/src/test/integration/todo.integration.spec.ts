import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@loom/database';
import { TodoService } from '../../modules/todo/services/todo.service';
import { createTestPrismaClient, destroyTestPrismaClient, resolveTestDatabaseUrl } from './setup';

/**
 * Todo 集成测试：真实 PostgreSQL（loom_test）+ 真实 Prisma + TodoService。
 *
 * 验证两类单测 mock 掉的东西：
 * 1. CRUD 真实落库（schema 约束、默认值、时间戳）
 * 2. 数据隔离查询语义（controller 的 where { userId } 模式，R5 红线）
 */
describe('Todo 集成测试（真实 PostgreSQL）', () => {
  let prisma: PrismaClient;
  let service: TodoService;
  const runId = Date.now();

  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // 护栏：确认连接的是测试库
    expect(resolveTestDatabaseUrl()).toContain('loom_test');

    prisma = await createTestPrismaClient();
    service = new TodoService(prisma as any);

    const suffix = `e2e-it-${runId}`;
    const userA = await prisma.user.create({
      data: {
        username: `usera_${suffix}`,
        email: `usera_${suffix}@test.local`,
        passwordHash: 'x',
      },
    });
    const userB = await prisma.user.create({
      data: {
        username: `userb_${suffix}`,
        email: `userb_${suffix}@test.local`,
        passwordHash: 'x',
      },
    });
    userAId = userA.id;
    userBId = userB.id;
  });

  afterAll(async () => {
    // 清理本 run 的测试数据
    await prisma.todo.deleteMany({
      where: { OR: [{ userId: userAId }, { userId: userBId }] },
    });
    await prisma.user.deleteMany({
      where: { OR: [{ id: userAId }, { id: userBId }] },
    });
    await destroyTestPrismaClient(prisma);
  });

  it('CRUD 真实落库：创建 → 回读 → 更新 → 删除', async () => {
    const created = await prisma.todo.create({
      data: {
        title: `it-crud-${runId}`,
        description: '集成测试',
        userId: userAId,
      },
    });

    // 默认值与时间戳由 schema 真实生成
    expect(created.status).toBe('pending');
    expect(created.isCompleted).toBe(false);
    expect(created.createdAt).toBeInstanceOf(Date);

    const updated = await prisma.todo.update({
      where: { id: created.id },
      data: { title: `it-crud-${runId}-updated`, priority: 2 },
    });
    expect(updated.title).toMatch(/-updated$/);
    expect(updated.priority).toBe(2);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

    await prisma.todo.delete({ where: { id: created.id } });
    const gone = await prisma.todo.findUnique({ where: { id: created.id } });
    expect(gone).toBeNull();
  });

  it('TodoService 自定义方法：complete/uncomplete 真实生效', async () => {
    const todo = await prisma.todo.create({
      data: { title: `it-service-${runId}`, userId: userAId },
    });

    const completed = await service.complete(todo.id);
    expect(completed.isCompleted).toBe(true);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeInstanceOf(Date);

    const uncompleted = await service.uncomplete(todo.id);
    expect(uncompleted.isCompleted).toBe(false);
    expect(uncompleted.status).toBe('pending');
    expect(uncompleted.completedAt).toBeNull();

    await prisma.todo.delete({ where: { id: todo.id } });
  });

  it('数据隔离（R5）：列表按 userId 过滤，只见到自己的', async () => {
    const aTodo = await prisma.todo.create({
      data: { title: `it-iso-a-${runId}`, userId: userAId },
    });
    await prisma.todo.create({
      data: { title: `it-iso-b-${runId}`, userId: userBId },
    });

    // controller list 的隔离模式：where { userId: currentUser.id }
    const listForA = await prisma.todo.findMany({
      where: { userId: userAId },
    });
    expect(listForA.length).toBeGreaterThanOrEqual(1);
    expect(listForA.every((t) => t.userId === userAId)).toBe(true);
    expect(listForA.some((t) => t.title === `it-iso-a-${runId}`)).toBe(true);

    await prisma.todo.delete({ where: { id: aTodo.id } });
  });

  it('数据隔离（R5）：跨用户按 id+userId 访问为空，update/delete 不越权', async () => {
    const aTodo = await prisma.todo.create({
      data: { title: `it-cross-${runId}`, userId: userAId },
    });

    // controller getOne/update/remove 的隔离模式：where { id, userId }
    const crossRead = await prisma.todo.findFirst({
      where: { id: aTodo.id, userId: userBId },
    });
    expect(crossRead).toBeNull();

    const crossUpdate = await prisma.todo.updateMany({
      where: { id: aTodo.id, userId: userBId },
      data: { title: 'hacked' },
    });
    expect(crossUpdate.count).toBe(0);

    const crossDelete = await prisma.todo.deleteMany({
      where: { id: aTodo.id, userId: userBId },
    });
    expect(crossDelete.count).toBe(0);

    // 数据未被篡改
    const untouched = await prisma.todo.findUnique({ where: { id: aTodo.id } });
    expect(untouched?.title).toBe(`it-cross-${runId}`);

    await prisma.todo.delete({ where: { id: aTodo.id } });
  });
});
