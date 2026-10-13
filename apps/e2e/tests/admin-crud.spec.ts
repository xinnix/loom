import { test, expect, type Page } from '@playwright/test';

/** Admin 登录（seed 账号 superadmin@example.com） */
async function login(page: Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /用户名/ }).fill('superadmin@example.com');
  await page.getByRole('textbox', { name: /密\s*码/ }).fill('password123');
  await page.keyboard.press('Enter');
  // 登录成功后离开 /login（默认跳 /dashboard，该路由 404 但鉴权态已建立）
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

test.describe('Admin LlmConfig CRUD 主路径（E1）', () => {
  // 唯一化测试数据，删除用例自行清理
  const key = `e2e-llm-${Date.now()}`;
  const name = `E2E 测试配置 ${key}`;

  test('登录 → 新建 → 编辑 → 删除', async ({ page }) => {
    await login(page);

    // 列表页
    await page.goto('/ai/llm-configs');
    await expect(page.getByRole('heading', { name: '模型配置' })).toBeVisible();

    // 新建（StandardListPage Modal 表单；AntD 两字按钮自动插空格，用正则）
    await page.getByRole('button', { name: /新建/ }).click();
    await page.getByLabel('显示名').fill(name);
    await page.getByLabel('配置键').fill(key);
    await page.getByPlaceholder('模型名，如 deepseek-chat').fill('e2e-model');
    await page.getByPlaceholder('sk-...（编辑时留空 = 不修改）').fill('sk-e2e-fake-key');
    await page.getByRole('button', { name: /确\s*定/ }).click();
    await expect(page.getByRole('cell', { name }).first()).toBeVisible();

    // 编辑：改名
    const row = page.getByRole('row', { name });
    await row.getByRole('button', { name: /编辑/ }).click();
    const newName = `${name}-edited`;
    await page.getByLabel('显示名').fill(newName);
    await page.getByRole('button', { name: /确\s*定/ }).click();
    await expect(page.getByRole('cell', { name: newName }).first()).toBeVisible();

    // 删除（Popconfirm 确认）
    const editedRow = page.getByRole('row', { name: newName });
    await editedRow.getByRole('button', { name: /删除/ }).click();
    await page
      .getByRole('button', { name: /确\s*定|OK/ })
      .first()
      .click();
    await expect(page.getByRole('cell', { name: newName })).toHaveCount(0);
  });
});

test.describe('Admin Todo 只读路径（E1）', () => {
  test('登录 → 列表可见且无创建入口（用户端数据语义）', async ({ page }) => {
    await login(page);

    await page.goto('/todos');
    await expect(page.getByRole('heading', { name: 'Todo 示例管理' })).toBeVisible();
    // Todo 是用户端数据（REST 注入 userId），Admin 不提供创建入口
    await expect(page.getByRole('button', { name: /新建/ })).toHaveCount(0);
  });
});
