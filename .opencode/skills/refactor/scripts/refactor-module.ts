#!/usr/bin/env tsx
/**
 * refactor-module.ts — 重构模块为脚手架标准模式
 *
 * 用法:
 *   npx tsx refactor-module.ts <module-name> [--dry-run] [--backend-only] [--frontend-only]
 *
 * 调用 analyze-module.ts --json 获取分析结果，生成重构计划并执行。
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../../..');

// ============================================
// Types
// ============================================

interface AnalysisResult {
  moduleName: string;
  standardization: {
    level: string;
    score: number;
    details: string[];
  };
  backend: {
    service: {
      filePath: string | null;
      exists: boolean;
      loc: number;
      usesBaseService: boolean;
      customMethods: string[];
      crudMethods: string[];
    };
    router: {
      filePath: string | null;
      exists: boolean;
      loc: number;
      usesCreateCrudRouter: boolean;
      usesCreateCrudRouterWithCustom: boolean;
      customProcedures: string[];
      crudProcedures: string[];
    };
  };
  frontend: {
    exists: boolean;
    pages: string[];
    usesStandardListPage: boolean;
    usesStandardForm: boolean;
    totalLoc: number;
  };
  schema: {
    prismaModelExists: boolean;
    prismaModelFields: number;
    prismaModelRelations: string[];
    zodSchemaDefined: boolean;
    zodSchemaNames: string[];
  };
  refactoringSuggestions: string[];
}

interface FileOperation {
  type: 'modify';
  path: string;
  originalContent: string;
  description: string;
}

// ============================================
// Utility
// ============================================

function getFilePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function countLines(content: string): number {
  return content.split('\n').length;
}

// ============================================
// Rollback support
// ============================================

const fileOperations: FileOperation[] = [];

function rollback(): void {
  console.log('\n\x1b[33m%s\x1b[0m', '⚠ Rolling back changes...');
  for (let i = fileOperations.length - 1; i >= 0; i--) {
    const op = fileOperations[i];
    try {
      fs.writeFileSync(op.path, op.originalContent);
      console.log(`  ↩ Restored: ${path.relative(PROJECT_ROOT, op.path)}`);
    } catch (err) {
      console.error(`  ✗ Failed to restore: ${op.path}`);
    }
  }
}

// ============================================
// Analysis
// ============================================

function runAnalysis(moduleName: string): AnalysisResult | null {
  const analyzePath = path.join(__dirname, '../../analyze/scripts/analyze-module.ts');
  try {
    const output = execSync(`npx tsx "${analyzePath}" ${moduleName} --json`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 30000,
    });
    // Extract JSON from output (may have ANSI codes)
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Failed to run analysis:', (err as Error).message);
    return null;
  }
}

// ============================================
// Refactoring: Service → BaseService
// ============================================

function refactorService(moduleName: string, analysis: AnalysisResult, dryRun: boolean): void {
  const service = analysis.backend.service;
  if (!service.exists || service.usesBaseService) return;

  // Resolve service file path
  const possiblePaths = [
    getFilePath(`apps/api/src/modules/${moduleName}/services/${moduleName}.service.ts`),
    getFilePath(`apps/api/src/modules/${moduleName}/${moduleName}.service.ts`),
  ];
  const filePath = possiblePaths.find((p) => fs.existsSync(p));
  if (!filePath) {
    console.log(`  ⚠ Service file not found, skipping`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const pascalName = toPascalCase(moduleName);

  if (dryRun) {
    console.log(`\n  \x1b[36m[Backend] Service Refactor\x1b[0m`);
    console.log(`    File: ${path.relative(PROJECT_ROOT, filePath)}`);
    console.log(`    - Replace with BaseService<${pascalName}> inheritance`);
    if (service.customMethods.length > 0) {
      console.log(
        `    - Preserve: ${service.customMethods.join(', ')} (${service.customMethods.length} custom methods)`,
      );
    }
    return;
  }

  fileOperations.push({
    type: 'modify',
    path: filePath,
    originalContent: content,
    description: 'Service → BaseService',
  });

  // Find the class declaration
  const classMatch = content.match(/export\s+class\s+(\w+)\s*(?:extends\s+\w+\s*)?\{/);
  if (!classMatch) {
    console.log(`    ⚠ Could not find class declaration, skipping service refactor`);
    return;
  }

  const className = classMatch[1];

  // Find constructor for PrismaService injection
  const constructorMatch = content.match(
    /constructor\s*\(\s*(?:private\s+|readonly\s+)?(\w+)\s*:\s*PrismaService\s*\)/,
  );

  let newContent = content;

  // Add BaseService import if not present
  if (!newContent.includes('BaseService')) {
    const importLine = "import { BaseService } from '../../../common/base.service';";
    // Find last import line
    const lastImportIdx = newContent.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const nextNewline = newContent.indexOf('\n', lastImportIdx + 1);
      newContent =
        newContent.slice(0, nextNewline) + '\n' + importLine + newContent.slice(nextNewline);
    } else {
      newContent = importLine + '\n' + newContent;
    }
  }

  // Replace class declaration
  const newClassDecl = `export class ${className} extends BaseService<${pascalName}> {`;
  newContent = newContent.replace(/export\s+class\s+\w+\s*(?:extends\s+\w+\s*)?\{/, newClassDecl);

  // Replace constructor
  if (constructorMatch) {
    const newConstructor = `  constructor(prisma: PrismaService) {\n    super(prisma, '${moduleName}');\n  }`;
    newContent = newContent.replace(
      /constructor\s*\(\s*(?:private\s+|readonly\s+)?\w+\s*:\s*PrismaService\s*\)\s*\{[^}]*\}/,
      newConstructor,
    );
  }

  // Remove manual CRUD methods (findMany, findUnique, create, update, delete)
  const crudPatterns = [
    /(?:async\s+)?findMany\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{[\s\S]*?\n\s*\}(?:\s*\n)?/g,
    /(?:async\s+)?findUnique\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{[\s\S]*?\n\s*\}(?:\s*\n)?/g,
    /(?:async\s+)?findFirst\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{[\s\S]*?\n\s*\}(?:\s*\n)?/g,
    /(?:async\s+)?create\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{[\s\S]*?\n\s*\}(?:\s*\n)?/g,
    /(?:async\s+)?update\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{[\s\S]*?\n\s*\}(?:\s*\n)?/g,
    /(?:async\s+)?delete\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{[\s\S]*?\n\s*\}(?:\s*\n)?/g,
    /(?:async\s+)?count\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{[\s\S]*?\n\s*\}(?:\s*\n)?/g,
  ];

  for (const pattern of crudPatterns) {
    newContent = newContent.replace(pattern, '');
  }

  fs.writeFileSync(filePath, newContent);
  const locDiff = countLines(content) - countLines(newContent);
  console.log(
    `  \x1b[32m✓\x1b[0m Service refactored: ${path.relative(PROJECT_ROOT, filePath)} (${locDiff > 0 ? '-' : '+'}${Math.abs(locDiff)} lines)`,
  );
}

// ============================================
// Refactoring: Router → createCrudRouter
// ============================================

function refactorRouter(moduleName: string, analysis: AnalysisResult, dryRun: boolean): void {
  const router = analysis.backend.router;
  if (!router.exists || router.usesCreateCrudRouter) return;

  // Resolve router file path
  const possiblePaths = [
    getFilePath(`apps/api/src/modules/${moduleName}/trpc/${moduleName}.router.ts`),
    getFilePath(`apps/api/src/modules/${moduleName}/${moduleName}.router.ts`),
  ];
  const filePath = possiblePaths.find((p) => fs.existsSync(p));
  if (!filePath) {
    console.log(`  ⚠ Router file not found, skipping`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const pascalName = toPascalCase(moduleName);

  const hasCustomProcs = router.customProcedures.length > 0;
  const crudFunction = hasCustomProcs ? 'createCrudRouterWithCustom' : 'createCrudRouter';

  if (dryRun) {
    console.log(`\n  \x1b[36m[Backend] Router Refactor\x1b[0m`);
    console.log(`    File: ${path.relative(PROJECT_ROOT, filePath)}`);
    console.log(`    - Replace manual CRUD procedures with ${crudFunction}`);
    if (hasCustomProcs) {
      console.log(
        `    - Preserve: ${router.customProcedures.join(', ')} (${router.customProcedures.length} custom procedures)`,
      );
    }
    return;
  }

  fileOperations.push({
    type: 'modify',
    path: filePath,
    originalContent: content,
    description: 'Router → createCrudRouter',
  });

  // Extract custom procedure implementations
  const customProcBlocks: string[] = [];
  for (const procName of router.customProcedures) {
    // Match the full procedure definition: name: procedureType.xxx(...)
    const procRegex = new RegExp(
      `(\\s*${procName}\\s*:\\s*(?:permissionProcedure|publicProcedure|protectedProcedure)[\\s\\S]*?(?=\\n\\s*\\w+\\s*:|\\n\\};?\\s*$))`,
      'm',
    );
    const procMatch = procRegex.exec(content);
    if (procMatch) {
      customProcBlocks.push(procMatch[1].trim());
    }
  }

  // Generate new router content
  const importLine = hasCustomProcs
    ? `import { ${crudFunction} } from '../../../trpc/trpc.helper';`
    : `import { ${crudFunction} } from '../../../trpc/trpc.helper';`;

  // Build custom procedures callback
  let customCallback = '';
  if (hasCustomProcs) {
    customCallback = `, (t, baseRouter) => ({
${customProcBlocks.map((b) => '  ' + b).join(',\n')}
})`;
  }

  const searchFieldsStr = analysis.schema.prismaModelFields > 5 ? "['name']" : '';

  const newRouterContent = `import { ${crudFunction} } from '../../../trpc/trpc.helper';
import { Create${pascalName}Schema, Update${pascalName}Schema } from '@loom/shared';

export const ${moduleName}Router = ${crudFunction}('${pascalName}', {
  create: { input: Create${pascalName}Schema },
  update: { input: Update${pascalName}Schema },${searchFieldsStr ? `\n  searchFields: ${searchFieldsStr},` : ''}
}${customCallback});
`;

  fs.writeFileSync(filePath, newRouterContent);
  const locDiff = countLines(content) - countLines(newRouterContent);
  console.log(
    `  \x1b[32m✓\x1b[0m Router refactored: ${path.relative(PROJECT_ROOT, filePath)} (${locDiff > 0 ? '-' : '+'}${Math.abs(locDiff)} lines)`,
  );
}

// ============================================
// Refactoring: Frontend → StandardListPage
// ============================================

function refactorFrontend(moduleName: string, analysis: AnalysisResult, dryRun: boolean): void {
  const frontend = analysis.frontend;
  if (frontend.pages.length === 0 || frontend.usesStandardListPage) return;

  const pascalName = toPascalCase(moduleName);

  // Find the list page
  const listPageFile = frontend.pages.find((f) => f.includes('ListPage'));
  if (!listPageFile) return;

  const filePath = getFilePath(`apps/admin/src/modules/${moduleName}/pages/${listPageFile}`);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf-8');

  if (dryRun) {
    console.log(`\n  \x1b[36m[Frontend] List Page Refactor\x1b[0m`);
    console.log(`    File: apps/admin/src/modules/${moduleName}/pages/${listPageFile}`);
    console.log(`    - Replace with StandardListPage component`);
    console.log(`    - Note: Review generated config for column definitions`);
    return;
  }

  fileOperations.push({
    type: 'modify',
    path: filePath,
    originalContent: content,
    description: 'Frontend → StandardListPage',
  });

  // Generate StandardListPage template
  const newContent = `import StandardListPage from '../../shared/components/StandardListPage';

const ${pascalName}ListPage: React.FC = () => {
  return (
    <StandardListPage
      resource="${moduleName}"
      columns={[
        // TODO: Review and adjust column definitions
        { title: 'ID', dataIndex: 'id', key: 'id', hideInForm: true },
        { title: '名称', dataIndex: 'name', key: 'name' },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', hideInForm: true },
      ]}
      formFields={[
        // TODO: Review and adjust form field definitions
        { name: 'name', label: '名称', type: 'text', rules: [{ required: true }] },
      ]}
      formLayout="modal"
    />
  );
};

export default ${pascalName}ListPage;
`;

  fs.writeFileSync(filePath, newContent);
  const locDiff = countLines(content) - countLines(newContent);
  console.log(
    `  \x1b[32m✓\x1b[0m Frontend refactored: apps/admin/src/modules/${moduleName}/pages/${listPageFile} (${locDiff > 0 ? '-' : '+'}${Math.abs(locDiff)} lines)`,
  );
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Module Refactoring Tool

Usage: refactor-module.ts <module-name> [options]

Options:
  --help, -h          Show this help message
  --dry-run           Preview refactoring plan without modifying files
  --backend-only      Only refactor backend (Service + Router)
  --frontend-only     Only refactor frontend (List Page)

Examples:
  refactor-module.ts user --dry-run
  refactor-module.ts user --backend-only
  refactor-module.ts user
`);
    process.exit(0);
  }

  const moduleName = args[0];
  const dryRun = args.includes('--dry-run');
  const backendOnly = args.includes('--backend-only');
  const frontendOnly = args.includes('--frontend-only');

  console.log(`\x1b[1;35m  Module Refactoring: ${toPascalCase(moduleName)}\x1b[0m`);
  console.log(`  ${'='.repeat(50)}`);

  if (dryRun) {
    console.log('  \x1b[33mMode: DRY RUN (no files will be modified)\x1b[0m\n');
  }

  // Run analysis
  console.log('  Running analysis...');
  const analysis = runAnalysis(moduleName);
  if (!analysis) {
    console.error('\x1b[31m  ✗ Failed to analyze module. Make sure the module exists.\x1b[0m');
    process.exit(1);
  }

  const currentScore = analysis.standardization.score;
  const estimatedScore = Math.min(100, currentScore + 50);
  console.log(`  Current score: ${currentScore}/100 → Estimated: ${estimatedScore}/100\n`);

  try {
    // Backend refactoring
    if (!frontendOnly) {
      refactorService(moduleName, analysis, dryRun);
      refactorRouter(moduleName, analysis, dryRun);
    }

    // Frontend refactoring
    if (!backendOnly) {
      refactorFrontend(moduleName, analysis, dryRun);
    }

    if (dryRun) {
      console.log(`\n  \x1b[33mRun without --dry-run to apply these changes.\x1b[0m`);
    } else {
      console.log('\n  \x1b[32mRefactoring complete!\x1b[0m');
      console.log('  \x1b[36mNext steps:\x1b[0m');
      console.log('    1. Review the changes with git diff');
      console.log('    2. Run /type-check to verify types');
      console.log('    3. Start servers and test functionality');
      console.log('    4. Run /analyze again to verify score improvement\n');
    }
  } catch (error) {
    console.error(`\n  \x1b[31m✗ Refactoring failed: ${(error as Error).message}\x1b[0m`);
    if (!dryRun) {
      rollback();
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
