import { test, expect, type Page } from '@playwright/test';

/** Web 端登录（seed 账号 user@example.com，REST + httpOnly Cookie） */
async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('请输入用户名').fill('user@example.com');
  await page.getByPlaceholder('请输入密码').fill('password123');
  await page.getByRole('button', { name: /登录|登 录/ }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

test.describe('Web 登录 → Todo 流（E1）', () => {
  const uniqueTitle = `e2e-web-todo-${Date.now()}`;

  test('登录 → 创建 Todo → 列表可见', async ({ page }) => {
    await login(page);

    await page.goto('/todos/create');
    await page.getByPlaceholder('输入待办事项标题...').fill(uniqueTitle);
    await page.getByRole('button', { name: /创建/ }).click();

    // 提交后回到列表（或跳详情），断言新 todo 可见
    await page.waitForURL(/todos/, { timeout: 15_000 });
    await expect(page.getByText(uniqueTitle).first()).toBeVisible();
  });
});
