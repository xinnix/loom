import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 测试（E1 最小版）。
 *
 * 前置条件：start-all（API :3000 / Admin :5173 / Web :3002）+ PostgreSQL 运行中，
 * 且 seed 已执行（superadmin@example.com / user@example.com，密码均为 password123）。
 *
 * 测试直接写开发库，用例内用唯一后缀隔离数据并自行清理。
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  projects: [
    {
      name: 'admin',
      testMatch: /admin-.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
    },
    {
      name: 'web',
      testMatch: /web-.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
    },
  ],
});
