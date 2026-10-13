#!/usr/bin/env tsx
/**
 * deleteModule - 删除由 genModule 生成的完整模块
 *
 * 用法:
 *   node delete-module.ts <moduleName> [--dry-run] [--force]
 *
 * 示例:
 *   node delete-module.ts product
 *   node delete-module.ts product --dry-run
 *   node delete-module.ts product --force
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 工具函数
// ============================================

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function toPlural(str: string): string {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies';
  } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
}

const PROJECT_ROOT = path.join(__dirname, '../../..');

function getFilePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

// Memory registry path (user-level, not in git)
function getMemoryRegistryPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.claude/projects/-Users-xinnix-code-loom/memory/module-registry.md');
}

function removeMemoryRegistryEntry(moduleName: string): void {
  const memoryPath = getMemoryRegistryPath();
  if (!fs.existsSync(memoryPath)) return;

  try {
    let content = fs.readFileSync(memoryPath, 'utf-8');

    // Remove rows matching | moduleName | in both tables
    const lines = content.split('\n');
    const filtered = lines.filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith(`| ${moduleName} `);
    });

    // Remove from Prisma Models list
    const pascalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    content = filtered.join('\n').replace(new RegExp(`\\b${pascalName},\\s*`, 'g'), '');

    fs.writeFileSync(memoryPath, content);
    console.log('  ℹ Memory registry updated');
  } catch (err) {
    console.warn('  ⚠ Failed to update memory registry:', (err as Error).message);
  }
}

// ============================================
// 文件操作
// ============================================

function deleteDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  ✓ 删除目录: ${path.relative(PROJECT_ROOT, dirPath)}`);
  }
}

function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`  ✓ 删除文件: ${path.relative(PROJECT_ROOT, filePath)}`);
  }
}

// ============================================
// 配置文件更新
// ============================================

function updateAppRouter(moduleName: string, dryRun: boolean): void {
  const camelName = toCamelCase(moduleName);
  const routerPath = getFilePath('apps/api/src/trpc/app.router.ts');

  if (!fs.existsSync(routerPath)) {
    console.log(`  ⚠ 文件不存在: ${path.relative(PROJECT_ROOT, routerPath)}`);
    return;
  }

  let content = fs.readFileSync(routerPath, 'utf-8');
  let modified = false;

  // Remove import line
  const importPattern = new RegExp(
    `import \\{ ${camelName}Router \\} from ["']../modules/${moduleName}/trpc/${camelName}\\.router["'];\\n`,
  );
  if (importPattern.test(content)) {
    content = content.replace(importPattern, '');
    modified = true;
    console.log(`  ✓ 移除 import: ${camelName}Router`);
  }

  // Remove router registration
  const routerPattern = new RegExp(`  ${camelName}: ${camelName}Router,\\n`);
  if (routerPattern.test(content)) {
    content = content.replace(routerPattern, '');
    modified = true;
    console.log(`  ✓ 移除路由注册: ${camelName}`);
  }

  if (modified && !dryRun) {
    fs.writeFileSync(routerPath, content);
  } else if (modified) {
    console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, routerPath)}`);
  }
}

function updateAppTsx(moduleName: string, dryRun: boolean): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const appPath = getFilePath('apps/admin/src/App.tsx');

  if (!fs.existsSync(appPath)) {
    console.log(`  ⚠ 文件不存在: ${path.relative(PROJECT_ROOT, appPath)}`);
    return;
  }

  let content = fs.readFileSync(appPath, 'utf-8');
  let modified = false;

  // Remove import（兼容旧版单页与新版双页导出）
  const importPattern = new RegExp(
    `import \\{ ${pascalName}ListPage(, ${pascalName}DetailPage)? \\} from ["']./modules/${moduleName}["'];\\n`,
  );
  if (importPattern.test(content)) {
    content = content.replace(importPattern, '');
    modified = true;
    console.log(`  ✓ 移除导入: ${pascalName}ListPage`);
  }

  // Remove resource（含行首缩进，整行移除）
  const resourcePattern = new RegExp(
    `\\n[ \\t]*\\{\\s*name: ["']${camelName}["'],\\s*list: ["']/${pluralName}["'],\\s*\\},`,
  );
  if (resourcePattern.test(content)) {
    content = content.replace(resourcePattern, '');
    modified = true;
    console.log(`  ✓ 移除资源配置: ${camelName}`);
  }

  // Remove routes（list + detail，含行首缩进，整行移除）
  const routePattern = new RegExp(
    `\\n[ \\t]*<Route path=["']${pluralName}(/:id)?["']\\s+element=\\{<${pascalName}(ListPage|DetailPage)\\s*/>\\}\\s*/>`,
    'g',
  );
  if (routePattern.test(content)) {
    content = content.replace(routePattern, '');
    modified = true;
    console.log(`  ✓ 移除路由: /${pluralName}（含详情）`);
  }

  if (modified && !dryRun) {
    fs.writeFileSync(appPath, content);
  } else if (modified) {
    console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, appPath)}`);
  }
}

function updateAdminLayout(moduleName: string, dryRun: boolean): void {
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const layoutPath = getFilePath('apps/admin/src/shared/layouts/AdminLayout.tsx');

  if (!fs.existsSync(layoutPath)) {
    console.log(`  ⚠ 文件不存在: ${path.relative(PROJECT_ROOT, layoutPath)}`);
    return;
  }

  let content = fs.readFileSync(layoutPath, 'utf-8');
  let modified = false;

  // Remove menu item from menuConfig array（含行首缩进，整行移除）
  const menuPattern = new RegExp(`\\n[ \\t]*\\{ key: [\"']/${pluralName}[\"'][^}]*\\},`);
  if (menuPattern.test(content)) {
    content = content.replace(menuPattern, '');
    modified = true;
    console.log(`  ✓ 移除菜单项: /${pluralName}`);
  }

  if (modified && !dryRun) {
    fs.writeFileSync(layoutPath, content);
  } else if (modified) {
    console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, layoutPath)}`);
  }
}

function removeZodSchema(moduleName: string, dryRun: boolean): void {
  const pascalName = toPascalCase(moduleName);
  const sharedPath = getFilePath('infra/shared/src/index.ts');

  if (!fs.existsSync(sharedPath)) {
    console.log(`  ⚠ 文件不存在: ${path.relative(PROJECT_ROOT, sharedPath)}`);
    return;
  }

  let content = fs.readFileSync(sharedPath, 'utf-8');
  let modified = false;

  // Remove the schema export block（含横幅注释与前置空行）
  const schemaPattern = new RegExp(
    `\\n// ={10,}\\n// ${pascalName} Schemas\\n// ={10,}\\n[\\s\\S]*?export const ${pascalName}Schema = \\{[\\s\\S]*?\\};\\n`,
  );

  if (schemaPattern.test(content)) {
    content = content.replace(schemaPattern, '');
    modified = true;
    console.log(`  ✓ 移除 Zod schema: ${pascalName}Schema`);
  }

  if (modified && !dryRun) {
    fs.writeFileSync(sharedPath, content);
  } else if (modified) {
    console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, sharedPath)}`);
  }
}

function removePrismaModel(moduleName: string, dryRun: boolean): void {
  const pascalName = toPascalCase(moduleName);
  const schemaPath = getFilePath('infra/database/prisma/schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    console.log(`  ⚠ 文件不存在: ${path.relative(PROJECT_ROOT, schemaPath)}`);
    return;
  }

  let content = fs.readFileSync(schemaPath, 'utf-8');
  let modified = false;

  // Remove the model block（model 闭合花括号顶格）
  const modelPattern = new RegExp(`\\nmodel ${pascalName} \\{[\\s\\S]*?\\n\\}\\n?`);
  if (modelPattern.test(content)) {
    content = content.replace(modelPattern, '');
    modified = true;
    console.log(`  ✓ 移除 Prisma model: ${pascalName}`);
  }

  if (modified && !dryRun) {
    fs.writeFileSync(schemaPath, content);
  } else if (modified) {
    console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, schemaPath)}`);
  }
}

function updateAppModule(moduleName: string, dryRun: boolean): void {
  const pascalName = toPascalCase(moduleName);
  const modulePath = getFilePath('apps/api/src/app.module.ts');

  if (!fs.existsSync(modulePath)) {
    console.log(`  ⚠ 文件不存在: ${path.relative(PROJECT_ROOT, modulePath)}`);
    return;
  }

  let content = fs.readFileSync(modulePath, 'utf-8');
  let modified = false;

  const importPattern = new RegExp(
    `import \\{ ${pascalName}Module \\} from ['"]\\.\\/modules\\/${moduleName}\\/module['\"];\\n`,
  );
  if (importPattern.test(content)) {
    content = content.replace(importPattern, '');
    modified = true;
    console.log(`  ✓ 移除 import: ${pascalName}Module`);
  }

  const entryPattern = new RegExp(`\\s*${pascalName}Module,\\n`);
  if (entryPattern.test(content)) {
    content = content.replace(entryPattern, '\n');
    modified = true;
    console.log(`  ✓ 移除模块注册: ${pascalName}Module`);
  }

  if (modified && !dryRun) {
    fs.writeFileSync(modulePath, content);
  } else if (modified) {
    console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, modulePath)}`);
  }
}

function updatePermissionRegistry(moduleName: string, dryRun: boolean): void {
  const camelName = toCamelCase(moduleName);
  const registryPath = getFilePath('infra/shared/src/permissions/registry.ts');

  if (!fs.existsSync(registryPath)) {
    console.log(`  ⚠ 文件不存在: ${path.relative(PROJECT_ROOT, registryPath)}`);
    return;
  }

  let content = fs.readFileSync(registryPath, 'utf-8');
  let modified = false;

  const entryPattern = new RegExp(`  ${camelName}: \\{\\n    create:[\\s\\S]*?\\n  \\},\\n`);
  if (entryPattern.test(content)) {
    content = content.replace(entryPattern, '');
    modified = true;
    console.log(`  ✓ 移除权限注册: ${camelName}`);
  }

  if (modified && !dryRun) {
    fs.writeFileSync(registryPath, content);
  } else if (modified) {
    console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, registryPath)}`);
  }
}

function updateMiniapp(moduleName: string, dryRun: boolean): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);

  // 1. 删除 API client 文件
  const apiClientPath = getFilePath(`apps/miniapp/src/api/${camelName}.ts`);
  if (fs.existsSync(apiClientPath)) {
    if (!dryRun) {
      deleteFile(apiClientPath);
    } else {
      console.log(`  [预览] 将删除文件: apps/miniapp/src/api/${camelName}.ts`);
    }
  }

  // 2. 移除 API_ENDPOINTS 端点
  const configPath = getFilePath('apps/miniapp/src/config/api.ts');
  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf-8');
    let modified = false;

    const endpointPattern = new RegExp(
      `  \\/\\/ ${pascalName} 相关\\n  ${camelName}List:[^\\n]*\\n  ${camelName}Detail:[^\\n]*\\n`,
    );
    if (endpointPattern.test(content)) {
      content = content.replace(endpointPattern, '');
      modified = true;
      console.log(`  ✓ 移除 miniapp 端点: ${camelName}List/Detail`);
    }

    if (modified && !dryRun) {
      fs.writeFileSync(configPath, content);
    } else if (modified) {
      console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, configPath)}`);
    }
  }

  // 3. 移除 api/index.ts 导出
  const indexPath = getFilePath('apps/miniapp/src/api/index.ts');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf-8');
    let modified = false;

    const exportPattern = new RegExp(`export \\* from ['"]\\./${camelName}['\"];\\n`);
    if (exportPattern.test(content)) {
      content = content.replace(exportPattern, '');
      modified = true;
      console.log(`  ✓ 移除 miniapp 导出: ./${camelName}`);
    }

    if (modified && !dryRun) {
      fs.writeFileSync(indexPath, content);
    } else if (modified) {
      console.log(`  [预览] 将更新: ${path.relative(PROJECT_ROOT, indexPath)}`);
    }
  }
}

function removeWebApiClient(moduleName: string, dryRun: boolean): void {
  const camelName = toCamelCase(moduleName);
  const apiDir = getFilePath('apps/web/src/lib/api');
  const clientPath = path.join(apiDir, `${camelName}.ts`);

  if (fs.existsSync(clientPath)) {
    if (!dryRun) {
      deleteFile(clientPath);
      // 目录为空则一并移除
      if (fs.existsSync(apiDir) && fs.readdirSync(apiDir).length === 0) {
        fs.rmdirSync(apiDir);
        console.log(`  ✓ 删除空目录: apps/web/src/lib/api/`);
      }
    } else {
      console.log(`  [预览] 将删除文件: apps/web/src/lib/api/${camelName}.ts`);
    }
  }
}

// ============================================
// 主删除逻辑
// ============================================

function deleteModule(moduleName: string, dryRun: boolean): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);

  console.log(`\n🗑️  删除模块: ${moduleName}\n`);

  // Delete backend module
  console.log('📦 后端模块:');
  const backendModulePath = getFilePath(`apps/api/src/modules/${moduleName}`);
  if (fs.existsSync(backendModulePath)) {
    if (!dryRun) {
      deleteDirectory(backendModulePath);
    } else {
      console.log(`  [预览] 将删除目录: apps/api/src/modules/${moduleName}/`);
    }
  } else {
    console.log(`  ⚠ 目录不存在: apps/api/src/modules/${moduleName}/`);
  }

  // Delete frontend module
  console.log('\n🎨 前端模块:');
  const frontendModulePath = getFilePath(`apps/admin/src/modules/${moduleName}`);
  if (fs.existsSync(frontendModulePath)) {
    if (!dryRun) {
      deleteDirectory(frontendModulePath);
    } else {
      console.log(`  [预览] 将删除目录: apps/admin/src/modules/${moduleName}/`);
    }
  } else {
    console.log(`  ⚠ 目录不存在: apps/admin/src/modules/${moduleName}/`);
  }

  // Update configuration files
  console.log('\n⚙️  配置文件:');
  updateAppRouter(moduleName, dryRun);
  updateAppTsx(moduleName, dryRun);
  updateAdminLayout(moduleName, dryRun);
  removeZodSchema(moduleName, dryRun);
  removePrismaModel(moduleName, dryRun);
  updateAppModule(moduleName, dryRun);
  updatePermissionRegistry(moduleName, dryRun);

  console.log('\n📱 Miniapp:');
  updateMiniapp(moduleName, dryRun);

  console.log('\n🌐 Web:');
  removeWebApiClient(moduleName, dryRun);

  console.log('\n✅ 模块删除完成!\n');

  // Update memory registry
  if (!dryRun) {
    removeMemoryRegistryEntry(moduleName);
  }

  if (!dryRun) {
    console.log('📋 后续步骤:');
    console.log(
      `   1. 迁移: cd infra/database && npx prisma migrate dev --name drop_${moduleName} && npx prisma generate`,
    );
    console.log('   2. 重建共享包: pnpm --filter @loom/shared build');
    console.log('   3. 重启后端和前端服务\n');
  }
}

// ============================================
// 确认对话框
// ============================================

function confirmAction(moduleName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`⚠️  确定要删除模块 "${moduleName}" 吗？此操作不可恢复！(yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// ============================================
// CLI 入口
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
用法: node delete-module.ts <moduleName> [options]

参数:
  moduleName          要删除的模块名称 (如: product, order, category)

选项:
  --dry-run, -d       预览模式，不实际删除
  --force, -f         强制删除，跳过确认
  --help, -h          显示帮助信息

示例:
  node delete-module.ts product
  node delete-module.ts product --dry-run
  node delete-module.ts product --force
`);
    process.exit(0);
  }

  const moduleName = args[0];
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const force = args.includes('--force') || args.includes('-f');

  if (dryRun) {
    console.log('🔍 预览模式 - 将显示将要删除的内容，但不会实际删除\n');
  }

  if (!dryRun && !force) {
    const confirmed = await confirmAction(moduleName);
    if (!confirmed) {
      console.log('\n❌ 操作已取消\n');
      process.exit(0);
    }
  }

  deleteModule(moduleName, dryRun);
}

main().catch((error) => {
  console.error('❌ 错误:', error.message);
  process.exit(1);
});
