#!/usr/bin/env tsx
/**
 * analyze-module.ts — Analyze module standardization level
 *
 * Detects whether modules use scaffold abstraction layers:
 * - BaseService, createCrudRouter / createCrudRouterWithCustom
 * - StandardListPage, StandardForm, StandardDetailPage
 *
 * Usage:
 *   analyze-module.ts <module-name>       Analyze a single module
 *   analyze-module.ts <module-name> --json JSON output
 *   analyze-module.ts --all               Analyze all modules
 *   analyze-module.ts --all --json        All modules, JSON output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../../..');

// ============================================
// ANSI Colors
// ============================================

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function colorize(text: string, color: string): string {
  return `${color}${text}${C.reset}`;
}

// ============================================
// Type Definitions
// ============================================

type StandardizationLevel = 'STANDARDIZED' | 'PARTIAL' | 'MANUAL';

interface ServiceAnalysis {
  filePath: string | null;
  exists: boolean;
  usesBaseService: boolean;
  customMethods: string[];
  crudMethods: string[];
  loc: number;
}

interface RouterAnalysis {
  filePath: string | null;
  exists: boolean;
  usesCreateCrudRouter: boolean;
  usesCreateCrudRouterWithCustom: boolean;
  customProcedures: string[];
  crudProcedures: string[];
  loc: number;
}

interface FrontendAnalysis {
  directoryExists: boolean;
  pages: string[];
  usesStandardListPage: boolean;
  usesStandardForm: boolean;
  usesStandardDetailPage: boolean;
  totalLoc: number;
  pageDetails: Array<{
    file: string;
    loc: number;
    usesStandardListPage: boolean;
    usesStandardForm: boolean;
    usesStandardDetailPage: boolean;
  }>;
}

interface SchemaAnalysis {
  prismaModelExists: boolean;
  prismaModelFields: number;
  prismaModelRelations: string[];
  prismaModelIndexes: string[];
  zodSchemaDefined: boolean;
  zodSchemaNames: string[];
  hasSearchFields: boolean;
}

interface ModuleReport {
  moduleName: string;
  service: ServiceAnalysis;
  router: RouterAnalysis;
  frontend: FrontendAnalysis;
  schema: SchemaAnalysis;
  standardization: {
    level: StandardizationLevel;
    score: number; // 0-100
    details: string[];
  };
}

// BaseService methods (inherited, not custom)
const BASE_SERVICE_METHODS = new Set([
  'list',
  'getOne',
  'getOneOrThrow',
  'create',
  'update',
  'remove',
  'removeMany',
  'count',
  'exists',
  'beforeCreate',
  'afterCreate',
  'beforeUpdate',
  'afterUpdate',
  'beforeDelete',
  'afterDelete',
  'beforeDeleteMany',
  'afterDeleteMany',
  'checkOwnership',
]);

// Standard CRUD procedure names
const CRUD_PROCEDURE_NAMES = new Set([
  'getMany',
  'getOne',
  'create',
  'update',
  'delete',
  'deleteMany',
]);

// ============================================
// File Utilities
// ============================================

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function countLines(content: string): number {
  return content.split('\n').length;
}

/**
 * Find all backend module directories
 */
function discoverBackendModules(): string[] {
  const modulesDir = path.join(PROJECT_ROOT, 'apps/api/src/modules');
  if (!fs.existsSync(modulesDir)) return [];

  return fs
    .readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

// ============================================
// Module Name Resolution
// ============================================

/**
 * Known module-to-model name mappings.
 * Most modules match by capitalizing, but some (plural forms) need explicit mapping.
 */
const MODULE_TO_MODEL_NAMES: Record<string, string[]> = {
  // moduleName -> [candidate Pascal names to try for Prisma/Zod lookup]
  agents: ['Agent', 'Agents'],
  auth: ['Auth'],
  admin: ['Admin'],
  payment: ['Payment', 'Order'],
  permission: ['Permission'],
  role: ['Role'],
  upload: ['Upload', 'File'],
  user: ['User'],
  wechat: ['Wechat', 'WeChat'],
};

/**
 * Get candidate Pascal-case model names for a module.
 * Tries: (1) explicit mapping, (2) simple singularization + capitalize, (3) direct capitalize.
 */
function getCandidateModelNames(moduleName: string): string[] {
  if (MODULE_TO_MODEL_NAMES[moduleName]) {
    return MODULE_TO_MODEL_NAMES[moduleName];
  }

  const pascalDirect = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

  // Simple pluralization heuristics
  const candidates = [pascalDirect];

  if (moduleName.endsWith('ies')) {
    // e.g., categories -> Category
    candidates.unshift(moduleName.slice(0, -3) + 'y');
    candidates.unshift(
      moduleName.slice(0, -3).charAt(0).toUpperCase() + moduleName.slice(0, -3).slice(1) + 'y',
    );
  } else if (moduleName.endsWith('es')) {
    // e.g., addresses -> Address
    candidates.unshift(moduleName.charAt(0).toUpperCase() + moduleName.slice(1, -2));
  } else if (moduleName.endsWith('s')) {
    // e.g., agents -> Agent
    candidates.unshift(moduleName.charAt(0).toUpperCase() + moduleName.slice(1, -1));
  }

  return candidates;
}

// ============================================
// Analysis Functions
// ============================================

/**
 * Analyze backend service file
 */
function analyzeService(moduleName: string): ServiceAnalysis {
  const result: ServiceAnalysis = {
    filePath: null,
    exists: false,
    usesBaseService: false,
    customMethods: [],
    crudMethods: [],
    loc: 0,
  };

  // Try standard path first, then module root (e.g., wechat.service.ts)
  const candidates = [
    path.join(PROJECT_ROOT, `apps/api/src/modules/${moduleName}/services/${moduleName}.service.ts`),
    path.join(PROJECT_ROOT, `apps/api/src/modules/${moduleName}/${moduleName}.service.ts`),
  ];

  let content: string | null = null;
  for (const candidate of candidates) {
    content = readFile(candidate);
    if (content !== null) {
      result.filePath = candidate;
      break;
    }
  }

  if (content === null) {
    return result;
  }

  result.exists = true;
  result.loc = countLines(content);

  // Check for BaseService extension
  result.usesBaseService = /extends\s+BaseService\s*[<('"]/.test(content);

  // JS/TS keywords that could be false-positive matched as method names
  const JS_KEYWORDS = new Set([
    'if',
    'else',
    'while',
    'for',
    'switch',
    'case',
    'catch',
    'finally',
    'return',
    'throw',
    'new',
    'typeof',
    'instanceof',
    'delete',
    'void',
    'do',
    'try',
    'break',
    'continue',
    'class',
    'function',
    'const',
    'let',
    'var',
    'import',
    'export',
    'from',
    'default',
    'type',
    'interface',
    'enum',
    'extends',
    'implements',
    'super',
    'this',
    'async',
    'await',
    'yield',
    'of',
    'in',
    'as',
  ]);

  // Extract async methods — match class method declarations
  const asyncMethodRegex = /(?:public\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
  const allMethods = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = asyncMethodRegex.exec(content)) !== null) {
    const methodName = match[1];
    // Filter out keywords, constructor, private methods, and class names
    if (
      methodName &&
      !JS_KEYWORDS.has(methodName) &&
      !methodName.startsWith('_') &&
      methodName !== 'constructor' &&
      methodName[0] === methodName[0].toLowerCase() // Skip class names (PascalCase)
    ) {
      allMethods.add(methodName);
    }
  }

  // Also check for arrow-function class properties: methodName = async (...) => {
  const arrowMethodRegex = /(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/g;
  while ((match = arrowMethodRegex.exec(content)) !== null) {
    const methodName = match[1];
    if (
      methodName &&
      !JS_KEYWORDS.has(methodName) &&
      !methodName.startsWith('_') &&
      methodName[0] === methodName[0].toLowerCase()
    ) {
      allMethods.add(methodName);
    }
  }

  for (const method of allMethods) {
    if (BASE_SERVICE_METHODS.has(method)) {
      result.crudMethods.push(method);
    } else {
      result.customMethods.push(method);
    }
  }

  return result;
}

/**
 * Analyze tRPC router file
 */
function analyzeRouter(moduleName: string): RouterAnalysis {
  const result: RouterAnalysis = {
    filePath: null,
    exists: false,
    usesCreateCrudRouter: false,
    usesCreateCrudRouterWithCustom: false,
    customProcedures: [],
    crudProcedures: [],
    loc: 0,
  };

  const filePath = path.join(
    PROJECT_ROOT,
    `apps/api/src/modules/${moduleName}/trpc/${moduleName}.router.ts`,
  );
  const content = readFile(filePath);

  if (content === null) {
    return result;
  }

  result.filePath = filePath;
  result.exists = true;
  result.loc = countLines(content);

  // Check for createCrudRouter usage
  result.usesCreateCrudRouter = /\bcreateCrudRouter\s*[<(]/.test(content);
  result.usesCreateCrudRouterWithCustom = /\bcreateCrudRouterWithCustom\s*[<(]/.test(content);

  // Extract procedure names from the router
  // Pattern 1: name: publicProcedure / name: permissionProcedure / name: protectedProcedure
  const procedureRegex =
    /(?:const\s+)?(\w+)\s*:\s*(?:permissionProcedure|publicProcedure|protectedProcedure|rateLimitedPublicProcedure)/g;
  const allProcedures = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = procedureRegex.exec(content)) !== null) {
    if (match[1] && match[1] !== 'procedure' && match[1][0] === match[1][0].toLowerCase()) {
      allProcedures.add(match[1]);
    }
  }

  // Pattern 2: for createCrudRouterWithCustom, look at the arrow function body
  // The custom procedures are defined in the () => ({ ... }) callback
  if (result.usesCreateCrudRouterWithCustom) {
    // Extract from the custom procedures callback
    const customCallbackRegex = /\(\)\s*=>\s*\(\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\)/;
    const customMatch = customCallbackRegex.exec(content);
    if (customMatch) {
      const callbackBody = customMatch[1];
      const cbProcedureRegex =
        /(\w+)\s*:\s*(?:permissionProcedure|publicProcedure|protectedProcedure|rateLimitedPublicProcedure)/g;
      while ((match = cbProcedureRegex.exec(callbackBody)) !== null) {
        if (match[1]) {
          allProcedures.add(match[1]);
        }
      }
    }
  }

  // Pattern 3: for manual routers using router({ ... })
  if (!result.usesCreateCrudRouter && !result.usesCreateCrudRouterWithCustom) {
    // Already captured via Pattern 1
  }

  for (const proc of allProcedures) {
    if (CRUD_PROCEDURE_NAMES.has(proc)) {
      result.crudProcedures.push(proc);
    } else {
      result.customProcedures.push(proc);
    }
  }

  return result;
}

/**
 * Analyze frontend pages
 */
function analyzeFrontend(moduleName: string): FrontendAnalysis {
  const result: FrontendAnalysis = {
    directoryExists: false,
    pages: [],
    usesStandardListPage: false,
    usesStandardForm: false,
    usesStandardDetailPage: false,
    totalLoc: 0,
    pageDetails: [],
  };

  const moduleDir = path.join(PROJECT_ROOT, `apps/admin/src/modules/${moduleName}`);

  if (!fs.existsSync(moduleDir)) {
    return result;
  }

  result.directoryExists = true;

  // Find all page files
  const pagesDir = path.join(moduleDir, 'pages');
  if (!fs.existsSync(pagesDir)) {
    return result;
  }

  const pageFiles = fs
    .readdirSync(pagesDir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
    .filter((f) => f !== 'index.ts');

  result.pages = pageFiles;

  for (const pageFile of pageFiles) {
    const filePath = path.join(pagesDir, pageFile);
    const content = readFile(filePath);

    if (content === null) continue;

    const loc = countLines(content);
    result.totalLoc += loc;

    const pageDetail = {
      file: pageFile,
      loc,
      usesStandardListPage: content.includes('StandardListPage'),
      usesStandardForm: content.includes('StandardForm'),
      usesStandardDetailPage: content.includes('StandardDetailPage'),
    };

    result.pageDetails.push(pageDetail);

    if (pageDetail.usesStandardListPage) result.usesStandardListPage = true;
    if (pageDetail.usesStandardForm) result.usesStandardForm = true;
    if (pageDetail.usesStandardDetailPage) result.usesStandardDetailPage = true;
  }

  return result;
}

/**
 * Analyze Prisma and Zod schemas.
 * Uses candidate model names to handle plural/singular mismatches
 * (e.g., module "agents" -> Prisma model "Agent").
 */
function analyzeSchema(moduleName: string): SchemaAnalysis {
  const result: SchemaAnalysis = {
    prismaModelExists: false,
    prismaModelFields: 0,
    prismaModelRelations: [],
    prismaModelIndexes: [],
    zodSchemaDefined: false,
    zodSchemaNames: [],
    hasSearchFields: false,
  };

  const candidateNames = getCandidateModelNames(moduleName);

  // Check Prisma schema — try each candidate until one matches
  const prismaPath = path.join(PROJECT_ROOT, 'infra/database/prisma/schema.prisma');
  const prismaContent = readFile(prismaPath);

  if (prismaContent !== null) {
    let matchedName: string | null = null;

    for (const candidate of candidateNames) {
      const modelRegex = new RegExp(`^model\\s+${candidate}\\s*\\{`, 'm');
      if (modelRegex.test(prismaContent)) {
        matchedName = candidate;
        break;
      }
    }

    if (matchedName) {
      result.prismaModelExists = true;

      // Extract the model block
      const blockStart = prismaContent.indexOf(`model ${matchedName} {`);
      if (blockStart !== -1) {
        const blockEnd = prismaContent.indexOf('}', blockStart);
        if (blockEnd !== -1) {
          const block = prismaContent.substring(blockStart, blockEnd);

          // Count fields (lines that look like field definitions)
          const fieldLines = block.split('\n').filter((line) => {
            const trimmed = line.trim();
            return (
              trimmed.length > 0 &&
              !trimmed.startsWith('//') &&
              !trimmed.startsWith('@@') &&
              !trimmed.startsWith('model') &&
              trimmed !== '{'
            );
          });
          result.prismaModelFields = fieldLines.length;

          // Extract relations (fields with type referencing another model)
          const relationRegex = /^\s+(\w+)\s+(\w+)\s*(?:\[\w+.*\])?\s*(?:@relation)/gm;
          let relMatch: RegExpExecArray | null;
          while ((relMatch = relationRegex.exec(block)) !== null) {
            result.prismaModelRelations.push(relMatch[1]);
          }

          // Extract indexes
          const indexRegex = /@@(?:unique|index)\(([^)]+)\)/g;
          let idxMatch: RegExpExecArray | null;
          while ((idxMatch = indexRegex.exec(block)) !== null) {
            result.prismaModelIndexes.push(idxMatch[0].trim());
          }
        }
      }
    }
  }

  // Check Zod schemas in shared/index.ts — try each candidate
  const sharedPath = path.join(PROJECT_ROOT, 'infra/shared/src/index.ts');
  const sharedContent = readFile(sharedPath);

  if (sharedContent !== null) {
    const foundSchemas = new Set<string>();

    for (const candidate of candidateNames) {
      const schemaPatterns = [
        new RegExp(
          `(Create${candidate}Schema|Update${candidate}Schema|${candidate}Schema|${candidate}ListQuerySchema)`,
          'g',
        ),
      ];

      for (const pattern of schemaPatterns) {
        let schemaMatch: RegExpExecArray | null;
        while ((schemaMatch = pattern.exec(sharedContent)) !== null) {
          foundSchemas.add(schemaMatch[1]);
        }
      }
    }

    if (foundSchemas.size > 0) {
      result.zodSchemaDefined = true;
      result.zodSchemaNames = Array.from(foundSchemas);
    }

    // Check for search fields in schema
    for (const candidate of candidateNames) {
      const searchPattern = new RegExp(`search.*${candidate}|${candidate}.*search`, 'i');
      if (searchPattern.test(sharedContent)) {
        result.hasSearchFields = true;
        break;
      }
    }
  }

  return result;
}

// ============================================
// Scoring & Rating
// ============================================

function computeStandardization(report: {
  service: ServiceAnalysis;
  router: RouterAnalysis;
  frontend: FrontendAnalysis;
  schema: SchemaAnalysis;
}): { level: StandardizationLevel; score: number; details: string[] } {
  const details: string[] = [];
  let score = 0;

  // Service analysis (max 30 points)
  if (report.service.exists) {
    if (report.service.usesBaseService) {
      score += 30;
      details.push('Service extends BaseService (+30)');
    } else {
      details.push('Service does NOT extend BaseService (refactor candidate)');
    }
  } else {
    details.push('No service file found (may not need one)');
    score += 10; // Modules without services aren't penalized
  }

  // Router analysis (max 30 points)
  if (report.router.exists) {
    if (report.router.usesCreateCrudRouter || report.router.usesCreateCrudRouterWithCustom) {
      const label = report.router.usesCreateCrudRouterWithCustom
        ? 'createCrudRouterWithCustom'
        : 'createCrudRouter';
      score += 30;
      details.push(`Router uses ${label} (+30)`);
    } else {
      details.push('Router does NOT use createCrudRouter (manual procedures, refactor candidate)');
      // Partial credit if they at least have CRUD procedure names
      if (report.router.crudProcedures.length > 0) {
        score += 10;
        details.push('Router has standard CRUD procedures but manually defined (+10)');
      }
    }
  } else {
    details.push('No tRPC router found');
  }

  // Frontend analysis (max 30 points)
  if (report.frontend.directoryExists && report.frontend.pages.length > 0) {
    if (report.frontend.usesStandardListPage) {
      score += 15;
      details.push('Frontend uses StandardListPage (+15)');
    } else {
      details.push('Frontend does NOT use StandardListPage (refactor candidate)');
    }

    if (report.frontend.usesStandardForm) {
      score += 10;
      details.push('Frontend uses StandardForm (+10)');
    }

    if (report.frontend.usesStandardDetailPage) {
      score += 5;
      details.push('Frontend uses StandardDetailPage (+5)');
    }
  } else {
    details.push('No frontend pages found (may not need admin UI)');
    score += 15; // Modules without frontend aren't penalized
  }

  // Schema analysis (max 10 points)
  if (report.schema.prismaModelExists) {
    score += 5;
    details.push('Prisma model exists (+5)');
  } else {
    details.push('No Prisma model found');
  }

  if (report.schema.zodSchemaDefined) {
    score += 5;
    details.push('Zod schemas defined (+5)');
  } else {
    details.push('No Zod schemas found');
  }

  // Determine level
  let level: StandardizationLevel;
  if (score >= 80) {
    level = 'STANDARDIZED';
  } else if (score >= 40) {
    level = 'PARTIAL';
  } else {
    level = 'MANUAL';
  }

  return { level, score, details };
}

// ============================================
// Full Module Analysis
// ============================================

function analyzeModule(moduleName: string): ModuleReport {
  const service = analyzeService(moduleName);
  const router = analyzeRouter(moduleName);
  const frontend = analyzeFrontend(moduleName);
  const schema = analyzeSchema(moduleName);

  const standardization = computeStandardization({ service, router, frontend, schema });

  return {
    moduleName,
    service,
    router,
    frontend,
    schema,
    standardization,
  };
}

// ============================================
// Output Formatting
// ============================================

function levelBadge(level: StandardizationLevel): string {
  switch (level) {
    case 'STANDARDIZED':
      return colorize(` ${level} `, C.bgGreen + C.bold + C.white);
    case 'PARTIAL':
      return colorize(` ${level} `, C.bgYellow + C.bold + C.white);
    case 'MANUAL':
      return colorize(` ${level} `, C.bgRed + C.bold + C.white);
  }
}

function checkMark(value: boolean): string {
  return value ? colorize('Yes', C.green) : colorize('No', C.red);
}

function formatReport(report: ModuleReport): string {
  const lines: string[] = [];
  const { moduleName, service, router, frontend, schema, standardization } = report;
  const pascalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

  lines.push('');
  lines.push(colorize(`  Module Analysis: ${pascalName}`, C.bold + C.magenta));
  lines.push(colorize('  ' + '='.repeat(50), C.dim));
  lines.push('');

  // Standardization summary
  lines.push(
    `  Standardization: ${levelBadge(standardization.level)}  Score: ${colorize(`${standardization.score}/100`, C.bold)}`,
  );
  lines.push('');

  // Backend: Service
  lines.push(colorize('  Backend Service', C.bold + C.cyan));
  lines.push(colorize('  ' + '-'.repeat(40), C.dim));
  if (service.exists) {
    lines.push(
      `    File:           ${colorize(service.filePath!.replace(PROJECT_ROOT + '/', ''), C.dim)}`,
    );
    lines.push(`    Lines:          ${service.loc}`);
    lines.push(`    BaseService:    ${checkMark(service.usesBaseService)}`);
    if (service.crudMethods.length > 0) {
      lines.push(`    CRUD methods:   ${service.crudMethods.join(', ')}`);
    }
    if (service.customMethods.length > 0) {
      lines.push(`    Custom methods: ${colorize(service.customMethods.join(', '), C.yellow)}`);
    }
  } else {
    lines.push(colorize('    (no service file found)', C.dim));
  }
  lines.push('');

  // Backend: Router
  lines.push(colorize('  Backend Router', C.bold + C.cyan));
  lines.push(colorize('  ' + '-'.repeat(40), C.dim));
  if (router.exists) {
    lines.push(
      `    File:           ${colorize(router.filePath!.replace(PROJECT_ROOT + '/', ''), C.dim)}`,
    );
    lines.push(`    Lines:          ${router.loc}`);
    const routerType = router.usesCreateCrudRouterWithCustom
      ? 'createCrudRouterWithCustom'
      : router.usesCreateCrudRouter
        ? 'createCrudRouter'
        : 'manual router({ ... })';
    lines.push(
      `    Router type:    ${colorize(routerType, router.usesCreateCrudRouter || router.usesCreateCrudRouterWithCustom ? C.green : C.yellow)}`,
    );
    if (router.crudProcedures.length > 0) {
      lines.push(`    CRUD procs:     ${router.crudProcedures.join(', ')}`);
    }
    if (router.customProcedures.length > 0) {
      lines.push(`    Custom procs:   ${colorize(router.customProcedures.join(', '), C.yellow)}`);
    }
  } else {
    lines.push(colorize('    (no router file found)', C.dim));
  }
  lines.push('');

  // Frontend
  lines.push(colorize('  Frontend Pages', C.bold + C.cyan));
  lines.push(colorize('  ' + '-'.repeat(40), C.dim));
  if (frontend.directoryExists && frontend.pages.length > 0) {
    lines.push(`    Pages:          ${frontend.pages.join(', ')}`);
    lines.push(`    Total lines:    ${frontend.totalLoc}`);
    lines.push(`    StandardListPage: ${checkMark(frontend.usesStandardListPage)}`);
    lines.push(`    StandardForm:     ${checkMark(frontend.usesStandardForm)}`);
    lines.push(`    StandardDetail:   ${checkMark(frontend.usesStandardDetailPage)}`);
    // Per-page details
    for (const pd of frontend.pageDetails) {
      const tags: string[] = [];
      if (pd.usesStandardListPage) tags.push('StandardListPage');
      if (pd.usesStandardForm) tags.push('StandardForm');
      if (pd.usesStandardDetailPage) tags.push('StandardDetailPage');
      const tagStr = tags.length > 0 ? colorize(` [${tags.join(', ')}]`, C.green) : '';
      lines.push(`      ${pd.file} (${pd.loc} lines)${tagStr}`);
    }
  } else {
    lines.push(colorize('    (no frontend pages found)', C.dim));
  }
  lines.push('');

  // Schema
  lines.push(colorize('  Schema', C.bold + C.cyan));
  lines.push(colorize('  ' + '-'.repeat(40), C.dim));
  lines.push(
    `    Prisma model:   ${checkMark(schema.prismaModelExists)}${schema.prismaModelExists ? ` (${schema.prismaModelFields} fields)` : ''}`,
  );
  if (schema.prismaModelRelations.length > 0) {
    lines.push(`    Relations:      ${schema.prismaModelRelations.join(', ')}`);
  }
  if (schema.prismaModelIndexes.length > 0) {
    lines.push(`    Indexes:        ${schema.prismaModelIndexes.length} index(es)`);
  }
  lines.push(
    `    Zod schemas:    ${checkMark(schema.zodSchemaDefined)}${schema.zodSchemaNames.length > 0 ? ` (${schema.zodSchemaNames.join(', ')})` : ''}`,
  );
  lines.push('');

  // Standardization details
  lines.push(colorize('  Standardization Breakdown', C.bold + C.cyan));
  lines.push(colorize('  ' + '-'.repeat(40), C.dim));
  for (const detail of standardization.details) {
    const icon = detail.includes('(+')
      ? colorize('+', C.green)
      : detail.includes('NOT')
        ? colorize('!', C.red)
        : colorize('i', C.blue);
    lines.push(`    ${icon} ${detail}`);
  }
  lines.push('');

  // Refactoring suggestions
  const suggestions = getRefactoringSuggestions(report);
  if (suggestions.length > 0) {
    lines.push(colorize('  Refactoring Suggestions', C.bold + C.yellow));
    lines.push(colorize('  ' + '-'.repeat(40), C.dim));
    for (let i = 0; i < suggestions.length; i++) {
      lines.push(`    ${i + 1}. ${suggestions[i]}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function getRefactoringSuggestions(report: ModuleReport): string[] {
  const suggestions: string[] = [];

  if (report.service.exists && !report.service.usesBaseService) {
    suggestions.push(
      `Extend BaseService instead of manual CRUD in ${report.moduleName}.service.ts`,
    );
  }

  if (
    report.router.exists &&
    !report.router.usesCreateCrudRouter &&
    !report.router.usesCreateCrudRouterWithCustom
  ) {
    if (report.router.crudProcedures.length >= 3) {
      suggestions.push(
        `Use createCrudRouter or createCrudRouterWithCustom to replace ${report.router.crudProcedures.length} manual CRUD procedures`,
      );
    }
  }

  if (report.frontend.directoryExists && report.frontend.pages.length > 0) {
    if (!report.frontend.usesStandardListPage) {
      // Check if there's a List page that could use StandardListPage
      const listPages = report.frontend.pages.filter((p) => p.includes('List'));
      if (listPages.length > 0) {
        suggestions.push(
          `Use StandardListPage in ${listPages.join(', ')} for config-driven list UI`,
        );
      }
    }
    if (
      !report.frontend.usesStandardForm &&
      report.frontend.pages.some((p) => p.includes('List') || p.includes('Form'))
    ) {
      suggestions.push('Use StandardForm for declarative form rendering');
    }
  }

  if (!report.schema.zodSchemaDefined && report.schema.prismaModelExists) {
    suggestions.push(`Define Zod schemas for ${report.moduleName} in infra/shared/src/index.ts`);
  }

  return suggestions;
}

function formatAllReport(reports: ModuleReport[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(colorize('  Module Standardization Summary', C.bold + C.magenta));
  lines.push(colorize('  ' + '='.repeat(70), C.dim));
  lines.push('');

  // Summary table
  const header = `  ${'Module'.padEnd(16)} ${'Level'.padEnd(18)} ${'Score'.padEnd(8)} ${'Service'.padEnd(10)} ${'Router'.padEnd(10)} ${'Frontend'.padEnd(12)}`;
  lines.push(colorize(header, C.bold));
  lines.push(colorize('  ' + '-'.repeat(70), C.dim));

  for (const report of reports) {
    const { moduleName, standardization, service, router, frontend } = report;
    const pascalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

    const levelStr =
      standardization.level === 'STANDARDIZED'
        ? colorize('STANDARDIZED', C.green)
        : standardization.level === 'PARTIAL'
          ? colorize('PARTIAL', C.yellow)
          : colorize('MANUAL', C.red);

    const scoreStr = colorize(
      `${standardization.score}`,
      standardization.score >= 80 ? C.green : standardization.score >= 40 ? C.yellow : C.red,
    );

    const serviceStr = service.exists
      ? service.usesBaseService
        ? colorize('Base', C.green)
        : colorize('Manual', C.red)
      : colorize('-', C.dim);

    const routerStr = router.exists
      ? router.usesCreateCrudRouter || router.usesCreateCrudRouterWithCustom
        ? colorize('CRUD', C.green)
        : colorize('Manual', C.red)
      : colorize('-', C.dim);

    const feStr =
      frontend.directoryExists && frontend.pages.length > 0
        ? frontend.usesStandardListPage
          ? colorize('StdList', C.green)
          : colorize('Manual', C.red)
        : colorize('-', C.dim);

    const row = `  ${pascalName.padEnd(16)} ${levelStr.padEnd(18 + (standardization.level === 'STANDARDIZED' ? 9 : standardization.level === 'PARTIAL' ? 9 : 0))} ${scoreStr.padEnd(8 + (standardization.score >= 100 ? 0 : 0))} ${serviceStr}         ${routerStr}         ${feStr}`;
    lines.push(
      `  ${pascalName.padEnd(16)} ${levelStr}  ${scoreStr}   ${serviceStr}       ${routerStr}       ${feStr}`,
    );
  }

  lines.push('');

  // Statistics
  const total = reports.length;
  const standardized = reports.filter((r) => r.standardization.level === 'STANDARDIZED').length;
  const partial = reports.filter((r) => r.standardization.level === 'PARTIAL').length;
  const manual = reports.filter((r) => r.standardization.level === 'MANUAL').length;
  const avgScore = Math.round(reports.reduce((sum, r) => sum + r.standardization.score, 0) / total);

  lines.push(colorize('  Statistics', C.bold + C.cyan));
  lines.push(colorize('  ' + '-'.repeat(40), C.dim));
  lines.push(`    Total modules:    ${total}`);
  lines.push(
    `    ${colorize('STANDARDIZED', C.green)}:  ${standardized} (${Math.round((standardized / total) * 100)}%)`,
  );
  lines.push(
    `    ${colorize('PARTIAL', C.yellow)}:       ${partial} (${Math.round((partial / total) * 100)}%)`,
  );
  lines.push(
    `    ${colorize('MANUAL', C.red)}:         ${manual} (${Math.round((manual / total) * 100)}%)`,
  );
  lines.push(`    Average score:    ${avgScore}/100`);
  lines.push('');

  // Refactoring candidates
  const candidates = reports.filter((r) => r.standardization.level === 'MANUAL');
  if (candidates.length > 0) {
    lines.push(colorize('  Refactoring Candidates (MANUAL modules)', C.bold + C.yellow));
    lines.push(colorize('  ' + '-'.repeat(40), C.dim));
    for (const candidate of candidates) {
      const pascalName =
        candidate.moduleName.charAt(0).toUpperCase() + candidate.moduleName.slice(1);
      lines.push(`    ${colorize(pascalName, C.red)} (score: ${candidate.standardization.score})`);

      const suggestions = getRefactoringSuggestions(candidate);
      for (const s of suggestions) {
        lines.push(`      - ${s}`);
      }
    }
    lines.push('');
  }

  // Partial modules
  const partialCandidates = reports.filter((r) => r.standardization.level === 'PARTIAL');
  if (partialCandidates.length > 0) {
    lines.push(colorize('  Partial Standardization (could be improved)', C.bold + C.yellow));
    lines.push(colorize('  ' + '-'.repeat(40), C.dim));
    for (const candidate of partialCandidates) {
      const pascalName =
        candidate.moduleName.charAt(0).toUpperCase() + candidate.moduleName.slice(1);
      lines.push(
        `    ${colorize(pascalName, C.yellow)} (score: ${candidate.standardization.score})`,
      );

      const suggestions = getRefactoringSuggestions(candidate);
      for (const s of suggestions) {
        lines.push(`      - ${s}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================
// JSON Output
// ============================================

function formatJson(report: ModuleReport): object {
  return {
    moduleName: report.moduleName,
    standardization: {
      level: report.standardization.level,
      score: report.standardization.score,
      details: report.standardization.details,
    },
    backend: {
      service: {
        exists: report.service.exists,
        usesBaseService: report.service.usesBaseService,
        customMethods: report.service.customMethods,
        crudMethods: report.service.crudMethods,
        loc: report.service.loc,
      },
      router: {
        exists: report.router.exists,
        usesCreateCrudRouter: report.router.usesCreateCrudRouter,
        usesCreateCrudRouterWithCustom: report.router.usesCreateCrudRouterWithCustom,
        customProcedures: report.router.customProcedures,
        crudProcedures: report.router.crudProcedures,
        loc: report.router.loc,
      },
    },
    frontend: {
      exists: report.frontend.directoryExists,
      pages: report.frontend.pages,
      usesStandardListPage: report.frontend.usesStandardListPage,
      usesStandardForm: report.frontend.usesStandardForm,
      usesStandardDetailPage: report.frontend.usesStandardDetailPage,
      totalLoc: report.frontend.totalLoc,
    },
    schema: {
      prismaModelExists: report.schema.prismaModelExists,
      prismaModelFields: report.schema.prismaModelFields,
      prismaModelRelations: report.schema.prismaModelRelations,
      zodSchemaDefined: report.schema.zodSchemaDefined,
      zodSchemaNames: report.schema.zodSchemaNames,
    },
    refactoringSuggestions: getRefactoringSuggestions(report),
  };
}

function formatAllJson(reports: ModuleReport[]): object {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: reports.length,
      standardized: reports.filter((r) => r.standardization.level === 'STANDARDIZED').length,
      partial: reports.filter((r) => r.standardization.level === 'PARTIAL').length,
      manual: reports.filter((r) => r.standardization.level === 'MANUAL').length,
      averageScore: Math.round(
        reports.reduce((sum, r) => sum + r.standardization.score, 0) / reports.length,
      ),
    },
    modules: reports.map(formatJson),
  };
}

// ============================================
// CLI Entry Point
// ============================================

function main(): void {
  const args = process.argv.slice(2);

  const jsonOutput = args.includes('--json');
  const allModules = args.includes('--all');

  if (allModules) {
    const moduleNames = discoverBackendModules();
    const reports = moduleNames.map(analyzeModule);

    if (jsonOutput) {
      console.log(JSON.stringify(formatAllJson(reports), null, 2));
    } else {
      console.log(formatAllReport(reports));
    }
    return;
  }

  // Single module analysis
  const moduleName = args.find((a) => !a.startsWith('--'));

  if (!moduleName) {
    console.error(colorize('Usage:', C.bold));
    console.error('  analyze-module.ts <module-name>       Analyze a single module');
    console.error('  analyze-module.ts <module-name> --json JSON output');
    console.error('  analyze-module.ts --all               Analyze all modules');
    console.error('  analyze-module.ts --all --json        All modules, JSON output');
    process.exit(1);
  }

  // Validate module exists
  const moduleDir = path.join(PROJECT_ROOT, `apps/api/src/modules/${moduleName}`);
  const frontendDir = path.join(PROJECT_ROOT, `apps/admin/src/modules/${moduleName}`);

  if (!fs.existsSync(moduleDir) && !fs.existsSync(frontendDir)) {
    console.error(colorize(`Module "${moduleName}" not found.`, C.red));
    console.error(colorize('Available modules:', C.dim));

    const backendModules = discoverBackendModules();
    for (const m of backendModules) {
      console.error(`  - ${m}`);
    }
    process.exit(1);
  }

  const report = analyzeModule(moduleName);

  if (jsonOutput) {
    console.log(JSON.stringify(formatJson(report), null, 2));
  } else {
    console.log(formatReport(report));
  }
}

main();
