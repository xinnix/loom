#!/usr/bin/env tsx
// seed-data.ts — 基于 Prisma schema 动态生成假数据 SQL
//
// 解析 schema.prisma 中的 model 定义，根据字段名智能匹配假数据生成器，
// 输出 ON CONFLICT DO NOTHING 的 INSERT SQL 以保证幂等。
//
// 用法：
//   tsx .claude/skills/seed-data/scripts/seed-data.ts [options]
//
// 选项：
//   --module <name>   指定模型名（默认 Agent）
//   --count N         生成记录数（默认 5）
//   --dry-run         只打印 SQL，不执行
//   --all             生成所有可种子化的模型

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../../..');

// ============================================================
// CLI 参数解析
// ============================================================

interface CliOptions {
  module: string | null; // null means --all
  count: number;
  dryRun: boolean;
  all: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = { module: 'Agent', count: 5, dryRun: false, all: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--module' && args[i + 1]) {
      opts.module = args[++i];
    } else if (args[i] === '--count' && args[i + 1]) {
      opts.count = Math.max(1, parseInt(args[i + 1], 10) || 5);
      i++;
    } else if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--all') {
      opts.all = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: tsx seed-data.ts [options]

Options:
  --module <name>   Model name from schema.prisma (default: Agent)
  --count N         Number of records to generate (default: 5)
  --dry-run         Print SQL without executing
  --all             Generate for all seedable models
  --help, -h        Show this help

Seedable models (excluding junction/refresh-token models with base data):
  Agent

Examples:
  tsx seed-data.ts --module Agent --count 10
  tsx seed-data.ts --all --dry-run
`);
      process.exit(0);
    }
  }

  if (opts.all) {
    opts.module = null;
  }

  return opts;
}

// ============================================================
// 简易随机生成器（不依赖外部库）
// ============================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function randomAlphanumeric(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function cuid(): string {
  // Generate a CUID-like ID: 'cm' + base36 timestamp + random
  const timestamp = Date.now().toString(36).slice(-6);
  const random = randomAlphanumeric(17);
  return `cm${timestamp}${random}`.slice(0, 25);
}

// 假名字库
const FIRST_NAMES = [
  'James',
  'Mary',
  'Robert',
  'Patricia',
  'John',
  'Jennifer',
  'Michael',
  'Linda',
  'David',
  'Elizabeth',
  'William',
  'Barbara',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Christopher',
  'Lisa',
  'Daniel',
  'Nancy',
  'Wei',
  'Li',
  'Ming',
  'Xiao',
  'Jun',
  'Hui',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Zhang',
  'Li',
  'Wang',
  'Chen',
  'Liu',
  'Yang',
];

const WORDS = [
  'customer',
  'support',
  'sales',
  'marketing',
  'analytics',
  'helper',
  'assistant',
  'guide',
  'advisor',
  'consultant',
  'smart',
  'quick',
  'pro',
  'elite',
  'premium',
  'chat',
  'voice',
  'text',
  'visual',
  'data',
  'booking',
  'order',
  'payment',
  'delivery',
  'service',
];

const SENTENCE_FRAGMENTS = [
  'AI-powered',
  'automated',
  'intelligent',
  'smart',
  'advanced',
  'next-gen',
  'real-time',
  'multi-language',
  'contextual',
  'adaptive',
  'customer support',
  'sales assistant',
  'marketing helper',
  'data analysis',
  'content generation',
  'task automation',
  'question answering',
  'recommendation',
  'workflow optimization',
];

const PARAGRAPH_PARTS = [
  'This agent provides automated assistance for various tasks.',
  'Powered by advanced language models with context awareness.',
  'Designed to handle complex queries and provide accurate responses.',
  'Supports multi-turn conversations with memory retention.',
  'Integrates seamlessly with existing workflows and tools.',
  'Optimized for speed and accuracy in real-world scenarios.',
  'Built with enterprise-grade reliability and scalability.',
  'Features natural language understanding and generation.',
];

function randomFullName(): string {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

function randomFirstName(): string {
  return randomChoice(FIRST_NAMES);
}

function randomLastName(): string {
  return randomChoice(LAST_NAMES);
}

function randomEmail(): string {
  const first = randomChoice(FIRST_NAMES).toLowerCase();
  const last = randomChoice(LAST_NAMES).toLowerCase();
  const num = randomInt(1, 999);
  return `${first}.${last}${num}@example.com`;
}

function randomPhone(): string {
  return `1${randomInt(30, 99)}${randomInt(10000000, 99999999)}`;
}

function randomUsername(): string {
  return `${randomChoice(FIRST_NAMES).toLowerCase()}${randomChoice(LAST_NAMES).toLowerCase()}${randomInt(1, 999)}`;
}

function randomNickname(): string {
  const adjectives = ['Cool', 'Happy', 'Smart', 'Quick', 'Brave', 'Calm'];
  return `${randomChoice(adjectives)}${randomChoice(FIRST_NAMES)}${randomInt(1, 99)}`;
}

function randomSentence(wordCount: number = 3): string {
  const parts: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    parts.push(randomChoice(SENTENCE_FRAGMENTS));
  }
  return parts.join(' ');
}

function randomParagraph(): string {
  const count = randomInt(2, 4);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomChoice(PARAGRAPH_PARTS));
  }
  return parts.join(' ');
}

function randomUrl(): string {
  const subdomains = ['api', 'app', 'cdn', 'portal', 'dashboard'];
  const domains = ['example', 'demo', 'test', 'staging', 'platform'];
  const tlds = ['com', 'io', 'dev', 'app', 'net'];
  return `https://${randomChoice(subdomains)}.${randomChoice(domains)}.${randomChoice(tlds)}`;
}

function randomSlug(): string {
  const w1 = randomChoice(WORDS);
  const w2 = randomChoice(WORDS.filter((w) => w !== w1));
  return `${w1}-${w2}-${randomInt(1, 99)}`;
}

function randomIcon(): string {
  return `icon-${randomChoice(WORDS)}`;
}

function randomDifyApiKey(): string {
  return `app-${randomAlphanumeric(32)}`;
}

function randomDifyAppType(): string {
  return randomChoice(['agent', 'chat', 'completion', 'workflow']);
}

function randomDifyApiUrl(): string {
  const urls = [
    'https://api.dify.ai/v1',
    'https://api.dify.ai/v1',
    'https://api.dify.ai/v1',
    'https://cloud.dify.ai/v1',
  ];
  return randomChoice(urls);
}

function randomDate(withinDays: number = 30): string {
  const now = Date.now();
  const offset = Math.floor(Math.random() * withinDays * 24 * 60 * 60 * 1000);
  const d = new Date(now - offset);
  return d.toISOString();
}

function randomRecentDate(): string {
  return randomDate(30);
}

function randomPastDate(): string {
  return randomDate(365);
}

// 固定测试密码 hash (password123)
const TEST_PASSWORD_HASH = '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa';

// ============================================================
// Prisma Schema 解析器
// ============================================================

interface FieldDef {
  name: string;
  type: string;
  isOptional: boolean;
  isList: boolean;
  isId: boolean;
  hasDefault: boolean;
  defaultExpr?: string;
  isUnique: boolean;
  isRelation: boolean;
  relationName?: string;
  isUpdatedAt: boolean;
  dbColumnName?: string; // from @map
}

interface ModelDef {
  name: string;
  tableName: string; // from @@map
  fields: FieldDef[];
  uniqueConstraints: string[][]; // field combinations that are unique
  singleUniques: string[]; // fields with @unique
}

function parseSchema(): ModelDef[] {
  const schemaPath = path.join(PROJECT_ROOT, 'infra/database/prisma/schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models: ModelDef[] = [];

  // Split into model blocks
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const fields: FieldDef[] = [];
    const uniqueConstraints: string[][] = [];
    const singleUniques: string[] = [];
    let tableName = modelName.toLowerCase(); // default table name

    // Parse @@map for table name
    const mapMatch = body.match(/@@map\("(\w+)"\)/);
    if (mapMatch) {
      tableName = mapMatch[1];
    }

    // Parse @@unique constraints
    const uniqueCompositeRegex = /@@unique\(\[([^\]]+)\]\)/g;
    let uniqueMatch: RegExpExecArray | null;
    while ((uniqueMatch = uniqueCompositeRegex.exec(body)) !== null) {
      const fieldsStr = uniqueMatch[1];
      const fieldNames = fieldsStr.split(',').map((f) => f.trim().replace(/"/g, ''));
      uniqueConstraints.push(fieldNames);
    }

    // Parse field lines
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

      // Match field definition: name Type [@modifiers...]
      const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)(\?)?(\[\])?\s*(.*)/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const isOptional = fieldMatch[3] === '?';
      const isList = fieldMatch[4] === '[]';
      const rest = fieldMatch[5] || '';

      // Check if this is a relation field (type references another model)
      const isRelation = rest.includes('@relation');

      // Check for @id
      const isId = rest.includes('@id');

      // Check for @unique
      const isUnique = rest.includes('@unique');
      if (isUnique && !isRelation) {
        singleUniques.push(fieldName);
      }

      // Check for @default
      const hasDefault = rest.includes('@default');
      let defaultExpr: string | undefined;
      if (hasDefault) {
        const defMatch = rest.match(/@default\(([^)]+)\)/);
        if (defMatch) {
          defaultExpr = defMatch[1];
        }
      }

      // Check for @updatedAt
      const isUpdatedAt = rest.includes('@updatedAt');

      // Check for @map
      const mapFieldMatch = rest.match(/@map\("([^"]+)"\)/);
      const dbColumnName = mapFieldMatch ? mapFieldMatch[1] : undefined;

      // Skip if it's a relation-only field (not a scalar column)
      // Relation fields reference other models and are not DB columns
      const scalarTypes = [
        'String',
        'Int',
        'BigInt',
        'Float',
        'Decimal',
        'Boolean',
        'DateTime',
        'Json',
        'Bytes',
      ];

      // If type is not a scalar, it's a relation field — skip
      if (!scalarTypes.includes(fieldType) && !isRelation) {
        // This is a relation field type, skip it
        continue;
      }

      // Relation fields that are NOT scalar types are virtual
      if (!scalarTypes.includes(fieldType)) {
        continue;
      }

      fields.push({
        name: fieldName,
        type: fieldType,
        isOptional,
        isList,
        isId,
        hasDefault,
        defaultExpr,
        isUnique,
        isRelation,
        isUpdatedAt,
        dbColumnName,
      });
    }

    models.push({
      name: modelName,
      tableName,
      fields,
      uniqueConstraints,
      singleUniques,
    });
  }

  return models;
}

// ============================================================
// 假数据生成 — 字段名智能匹配
// ============================================================

// 需要跳过的字段（有数据库 DEFAULT 的）
function fieldHasDbDefault(field: FieldDef): boolean {
  if (field.isId && field.hasDefault) return true; // @default(cuid()) / @default(uuid())
  if (field.isUpdatedAt) return true; // @updatedAt
  if (field.hasDefault) {
    // Check common defaults that DB handles
    const expr = field.defaultExpr || '';
    if (
      expr === 'now()' ||
      expr === 'true' ||
      expr === 'false' ||
      expr === '0' ||
      expr.match(/^\d+$/)
    ) {
      return true;
    }
  }
  return false;
}

// 判断字段是否需要跳过（外键需要关联数据）
function isForeignKeyField(field: FieldDef): boolean {
  // Fields ending with 'Id' that are String type are likely foreign keys
  if (field.type === 'String' && field.name.endsWith('Id')) {
    return true;
  }
  return false;
}

function isCreatedAtOrUpdatedAt(field: FieldDef): boolean {
  return field.name === 'createdAt' || field.name === 'updatedAt' || field.isUpdatedAt;
}

// 根据字段名和类型生成假数据值（返回 SQL 字面量）
function generateFieldValue(field: FieldDef, _index: number): string | null {
  const name = field.name.toLowerCase();

  // ID fields — generate CUID-like value
  if (field.isId && field.type === 'String') {
    return `'${cuid()}'`;
  }

  // Skip foreign key fields — they require existing data
  if (isForeignKeyField(field)) {
    return null;
  }

  // DateTime fields
  if (field.type === 'DateTime') {
    if (field.name === 'createdAt' || field.name === 'updatedAt' || field.isUpdatedAt) {
      return `'${randomRecentDate()}'`;
    }
    if (name.includes('expires') || name.includes('expiry')) {
      return `'${randomFutureDate()}'`;
    }
    if (name.includes('revoked')) {
      return 'NULL'; // not revoked by default
    }
    if (name.includes('verified')) {
      return 'NULL'; // not verified by default
    }
    if (name.includes('lastlogin')) {
      return `'${randomRecentDate()}'`;
    }
    if (name.includes('assigned')) {
      return `'${randomRecentDate()}'`;
    }
    return `'${randomRecentDate()}'`;
  }

  // Boolean fields
  if (field.type === 'Boolean') {
    if (name.includes('active')) return 'true';
    if (name.includes('system')) return 'false';
    if (name.includes('verified')) return 'false';
    return 'true';
  }

  // Int fields
  if (field.type === 'Int') {
    if (name === 'sort' || name === 'order') return '0';
    if (name === 'level') return '0';
    return `${randomInt(0, 100)}`;
  }

  // Float / Decimal fields
  if (field.type === 'Float' || field.type === 'Decimal') {
    return `${randomFloat(0, 1000)}`;
  }

  // String fields — smart matching by name
  if (field.type === 'String') {
    // passwordHash
    if (name.includes('password') || name.includes('passwd')) {
      return sqlEscape(TEST_PASSWORD_HASH);
    }

    // email
    if (name === 'email') {
      return sqlEscape(randomEmail());
    }

    // phone
    if (name === 'phone' || name === 'mobile') {
      return sqlEscape(randomPhone());
    }

    // username
    if (name === 'username') {
      return sqlEscape(randomUsername());
    }

    // name (but not firstName/lastName)
    if (name === 'name' || name === 'fullname' || name === 'full_name') {
      return sqlEscape(randomFullName());
    }

    // firstName
    if (name === 'firstname' || name === 'first_name') {
      return sqlEscape(randomFirstName());
    }

    // lastName
    if (name === 'lastname' || name === 'last_name') {
      return sqlEscape(randomLastName());
    }

    // nickname
    if (name === 'nickname' || name === 'nick_name') {
      return sqlEscape(randomNickname());
    }

    // title
    if (name === 'title') {
      return sqlEscape(randomSentence(3));
    }

    // description
    if (name.includes('description') || name.includes('desc')) {
      return sqlEscape(randomParagraph());
    }

    // avatar
    if (name === 'avatar') {
      return sqlEscape(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAlphanumeric(8)}`);
    }

    // url / link / website
    if (name === 'url' || name === 'link' || name === 'website') {
      return sqlEscape(randomUrl());
    }

    // slug
    if (name === 'slug') {
      return sqlEscape(randomSlug());
    }

    // icon
    if (name === 'icon') {
      return sqlEscape(randomIcon());
    }

    // apiKey / secret / token
    if (name.includes('apikey') || name.includes('api_key') || name.includes('secret')) {
      return sqlEscape(randomAlphanumeric(32));
    }

    if (name.includes('token')) {
      return sqlEscape(randomAlphanumeric(40));
    }

    // difyApiUrl
    if (name === 'difyapiurl' || name === 'dify_api_url') {
      return sqlEscape(randomDifyApiUrl());
    }

    // difyApiKey
    if (name === 'difyapikey' || name === 'dify_api_key') {
      return sqlEscape(randomDifyApiKey());
    }

    // difyAppType
    if (name === 'difyapptype' || name === 'dify_app_type') {
      return sqlEscape(randomDifyAppType());
    }

    // openid
    if (name === 'openid' || name === 'open_id') {
      return sqlEscape(`oX_${randomAlphanumeric(26)}`);
    }

    // unionid
    if (name === 'unionid' || name === 'union_id') {
      return sqlEscape(`uX_${randomAlphanumeric(26)}`);
    }

    // sessionKey
    if (name === 'sessionkey' || name === 'session_key') {
      return sqlEscape(randomAlphanumeric(24));
    }

    // resource (for permissions)
    if (name === 'resource') {
      const resources = ['agent', 'dashboard', 'report', 'setting', 'log'];
      return sqlEscape(randomChoice(resources));
    }

    // action (for permissions)
    if (name === 'action') {
      const actions = ['create', 'read', 'update', 'delete'];
      return sqlEscape(randomChoice(actions));
    }

    // ipAddress
    if (name === 'ipaddress' || name === 'ip_address' || name === 'ip') {
      return sqlEscape(
        `${randomInt(10, 192)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      );
    }

    // userAgent
    if (name === 'useragent' || name === 'user_agent') {
      const agents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      ];
      return sqlEscape(randomChoice(agents));
    }

    // Generic string fallback
    return sqlEscape(`${field.name}_${randomAlphanumeric(6)}`);
  }

  return null;
}

function randomFutureDate(): string {
  const now = Date.now();
  const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
  const d = new Date(now + offset);
  return d.toISOString();
}

// SQL 字符串转义 — 单引号 doubling
function sqlEscape(value: string): string {
  const escaped = value.replace(/'/g, "''");
  return `'${escaped}'`;
}

// ============================================================
// INSERT SQL 生成
// ============================================================

// 默认跳过的模型（seed-base.sql 已覆盖 或 是关联表）
const SKIP_MODELS = new Set([
  'Admin', // seed-base.sql
  'User', // seed-base.sql
  'Role', // seed-base.sql
  'Permission', // seed-base.sql
  'AdminRole', // junction table
  'RolePermission', // junction table
  'AdminRefreshToken', // depends on admin data
  'UserRefreshToken', // depends on user data
]);

const SEEDABLE_MODELS = ['Agent'];

function generateInsertSQL(model: ModelDef, count: number): string {
  // Determine which columns to include
  const columns: { field: FieldDef; colName: string }[] = [];

  for (const field of model.fields) {
    // Skip fields with DB defaults that don't need seed values
    if (field.isId && field.hasDefault) {
      // Include ID — we generate cuid() ourselves for determinism
      columns.push({ field, colName: field.dbColumnName || field.name });
      continue;
    }

    if (field.isUpdatedAt) {
      // We'll include it with a value
      columns.push({ field, colName: field.dbColumnName || field.name });
      continue;
    }

    if (field.hasDefault && field.type === 'DateTime' && field.defaultExpr === 'now()') {
      // createdAt/updatedAt — include with explicit value
      columns.push({ field, colName: field.dbColumnName || field.name });
      continue;
    }

    if (field.hasDefault && field.type === 'Boolean') {
      // Boolean with default — include with explicit value
      columns.push({ field, colName: field.dbColumnName || field.name });
      continue;
    }

    if (
      field.hasDefault &&
      field.type === 'Int' &&
      (field.defaultExpr === '0' || field.defaultExpr?.match(/^\d+$/))
    ) {
      // Int with default — include with explicit value
      columns.push({ field, colName: field.dbColumnName || field.name });
      continue;
    }

    if (field.hasDefault && field.type === 'String') {
      // String with default like difyApiUrl — include with value
      columns.push({ field, colName: field.dbColumnName || field.name });
      continue;
    }

    columns.push({ field, colName: field.dbColumnName || field.name });
  }

  // Generate rows
  const rows: string[] = [];
  for (let i = 0; i < count; i++) {
    const values: string[] = [];
    for (const col of columns) {
      const value = generateFieldValue(col.field, i);
      if (value === null) {
        values.push('NULL');
      } else {
        values.push(value);
      }
    }
    rows.push(`  (${values.join(', ')})`);
  }

  // Determine ON CONFLICT target
  let conflictTarget = '';
  if (model.singleUniques.length > 0) {
    // Use first single unique field
    const uniqueField = model.fields.find((f) => f.name === model.singleUniques[0]);
    const colName = uniqueField?.dbColumnName || model.singleUniques[0];
    conflictTarget = `"${colName}"`;
  } else if (model.uniqueConstraints.length > 0) {
    // Use first composite unique
    const constraint = model.uniqueConstraints[0];
    const colNames = constraint.map((fn) => {
      const f = model.fields.find((fld) => fld.name === fn);
      return `"${f?.dbColumnName || fn}"`;
    });
    conflictTarget = colNames.join(', ');
  } else {
    // Fallback to id
    conflictTarget = '"id"';
  }

  // Build column list (quote identifiers that might be reserved or camelCase)
  const colList = columns.map((c) => `"${c.colName}"`).join(', ');

  const sql = [
    `-- Seed data for: ${model.name} (${count} records)`,
    `INSERT INTO ${model.tableName} (${colList})`,
    `VALUES`,
    rows.join(',\n'),
    `ON CONFLICT (${conflictTarget}) DO NOTHING;`,
  ].join('\n');

  return sql;
}

// ============================================================
// SQL 执行
// ============================================================

function executeSQL(sql: string): void {
  const dockerCommand = 'docker exec -i postgres psql -U xinnix -d opencode';
  try {
    execSync(dockerCommand, {
      input: sql,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    });
    console.log('SQL executed successfully.');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Failed to execute SQL:');
    console.error(msg);
    process.exit(1);
  }
}

// ============================================================
// 主流程
// ============================================================

function main(): void {
  const opts = parseArgs();

  console.log('Parsing schema.prisma...');
  const models = parseSchema();

  // Determine which models to seed
  let targetModels: ModelDef[];

  if (opts.all) {
    targetModels = models.filter((m) => !SKIP_MODELS.has(m.name));
  } else if (opts.module) {
    const target = models.find((m) => m.name.toLowerCase() === opts.module!.toLowerCase());
    if (!target) {
      console.error(`Model "${opts.module}" not found in schema.prisma.`);
      console.error(`Available models: ${models.map((m) => m.name).join(', ')}`);
      process.exit(1);
    }
    targetModels = [target];
  } else {
    // Default: seed Agent only
    const defaultModels = models.filter((m) => SEEDABLE_MODELS.includes(m.name));
    targetModels = defaultModels;
  }

  if (targetModels.length === 0) {
    console.log('No seedable models found.');
    process.exit(0);
  }

  // Generate SQL for each target model
  const sqlParts: string[] = [];

  for (const model of targetModels) {
    console.log(
      `Generating ${opts.count} records for ${model.name} (table: ${model.tableName})...`,
    );
    const sql = generateInsertSQL(model, opts.count);
    sqlParts.push(sql);
  }

  const fullSQL = sqlParts.join('\n\n');

  if (opts.dryRun) {
    console.log('\n--- Generated SQL (dry-run) ---\n');
    console.log(fullSQL);
    console.log('\n--- End of SQL ---\n');
  } else {
    console.log('\n--- Executing SQL ---\n');
    console.log(fullSQL);
    console.log('');
    executeSQL(fullSQL);
  }
}

main();
