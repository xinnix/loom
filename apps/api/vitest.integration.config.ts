import { defineConfig } from 'vitest/config';

/**
 * 集成测试配置：真实 PostgreSQL（loom_test 库）+ 真实 Prisma。
 *
 * 运行：pnpm --filter @loom/api run test:integration
 * 前置：本地 PostgreSQL 运行中；测试库由 setup 自动从 DATABASE_URL 改写 dbname 为 loom_test，
 * 迁移需已应用（infra/database 下 DATABASE_URL=<loom_test> prisma migrate deploy）。
 * 与单测隔离：`pnpm test`（vitest.config.ts）不含本目录。
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/integration/**/*.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
