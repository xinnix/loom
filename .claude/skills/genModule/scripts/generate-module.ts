#!/usr/bin/env tsx
/**
 * Full-Stack Module Generator for Loom
 *
 * Rapidly generates complete CRUD modules from database schema to frontend management pages.
 * Supports smart field analysis for 10+ business patterns, file upload capabilities.
 *
 * Phase 2 enhancements:
 * - Smart field inference (currency, email, phone, slug, date, audit fields)
 * - Relation field auto-generation (categoryId → Category Select, parentId → TreeSelect)
 * - UI pattern smart selection (modal vs separate pages)
 * - Validation rule intelligent generation (email, phone, url, currency validation)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Type Definitions
// ============================================

interface Field {
  name: string;
  type: string;
  required: boolean;
  enum?: string[];
  relation?: string;
}

interface InferredFieldConfig {
  uiComponent: string;
  uiProps: string;
  zodValidation: string;
  formField: string;
  columnRender: string;
  hideInForm?: boolean;
  hideInTable?: boolean;
  autoInject?: boolean;
}

interface RelationField {
  field: string;
  model: string;
  type: 'belongsTo' | 'hasMany' | 'hasOne';
  uiComponent: 'Select' | 'TreeSelect' | 'UserSelect';
  foreignKey: string;
}

type UIPattern = 'modal' | 'separate';

interface UIPatternConfig {
  pattern: UIPattern;
  pages: string[];
  reason: string;
}

interface BusinessPattern {
  name: string;
  keywords: string[];
  fields: Field[];
}

interface GenerateOptions {
  moduleName: string;
  fields?: Field[];
  fileUpload?: boolean;
  dryRun?: boolean;
}

// ============================================
// Business Patterns - Smart Field Analysis
// ============================================

const BUSINESS_PATTERNS: BusinessPattern[] = [
  {
    name: 'product',
    keywords: ['product', 'item', 'goods', 'merchandise', 'inventory', 'sku'],
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'price', type: 'float', required: true },
      { name: 'costPrice', type: 'float', required: false },
      { name: 'sku', type: 'string', required: true },
      { name: 'barcode', type: 'string', required: false },
      { name: 'stock', type: 'number', required: true },
      { name: 'minStock', type: 'number', required: false },
      { name: 'images', type: 'string', required: false },
      {
        name: 'status',
        type: 'enum',
        required: true,
        enum: ['active', 'inactive', 'discontinued'],
      },
    ],
  },
  {
    name: 'article',
    keywords: ['article', 'post', 'blog', 'news', 'content', 'story'],
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'content', type: 'text', required: true },
      { name: 'summary', type: 'text', required: false },
      { name: 'cover', type: 'string', required: false },
      { name: 'categoryId', type: 'string', required: false },
      { name: 'tags', type: 'string', required: false },
      { name: 'status', type: 'enum', required: true, enum: ['draft', 'published', 'archived'] },
      { name: 'viewCount', type: 'number', required: false },
      { name: 'publishedAt', type: 'date', required: false },
    ],
  },
  {
    name: 'todo',
    keywords: ['todo', 'task', 'assignment', 'chore', 'reminder'],
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'isCompleted', type: 'boolean', required: false },
      { name: 'priority', type: 'number', required: false },
      { name: 'dueDate', type: 'date', required: false },
      { name: 'assigneeId', type: 'string', required: false },
    ],
  },
  {
    name: 'order',
    keywords: ['order', 'purchase', 'transaction', 'checkout', 'booking'],
    fields: [
      { name: 'orderNumber', type: 'string', required: true },
      { name: 'customerId', type: 'string', required: true },
      { name: 'total', type: 'float', required: true },
      {
        name: 'status',
        type: 'enum',
        required: true,
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      },
      { name: 'notes', type: 'text', required: false },
      { name: 'shippingAddress', type: 'text', required: false },
    ],
  },
  {
    name: 'category',
    keywords: ['category', 'classification', 'group', 'section', 'topic'],
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'slug', type: 'string', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'parentId', type: 'string', required: false },
      { name: 'icon', type: 'string', required: false },
      { name: 'sortOrder', type: 'number', required: false },
      { name: 'status', type: 'enum', required: true, enum: ['ACTIVE', 'INACTIVE'] },
    ],
  },
  {
    name: 'user',
    keywords: ['user', 'customer', 'member', 'profile', 'account'],
    fields: [
      { name: 'username', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'firstName', type: 'string', required: false },
      { name: 'lastName', type: 'string', required: false },
      { name: 'avatar', type: 'string', required: false },
      { name: 'isActive', type: 'boolean', required: false },
    ],
  },
  {
    name: 'comment',
    keywords: ['comment', 'review', 'feedback', 'rating', 'testimonial'],
    fields: [
      { name: 'content', type: 'text', required: true },
      { name: 'authorId', type: 'string', required: true },
      { name: 'rating', type: 'number', required: false },
      { name: 'status', type: 'enum', required: true, enum: ['pending', 'approved', 'rejected'] },
    ],
  },
  {
    name: 'event',
    keywords: ['event', 'schedule', 'calendar', 'appointment', 'meeting'],
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'startAt', type: 'date', required: true },
      { name: 'endAt', type: 'date', required: true },
      { name: 'location', type: 'string', required: false },
      {
        name: 'status',
        type: 'enum',
        required: true,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      },
    ],
  },
];

// ============================================
// Field Type Mapping
// ============================================

const PRISMA_TYPE_MAP: Record<string, string> = {
  string: 'String',
  text: 'String',
  number: 'Int',
  float: 'Float',
  boolean: 'Boolean',
  date: 'DateTime',
  enum: 'String',
  image: 'String',
  file: 'String',
};

// ============================================
// Phase 2: Smart Field Inference Rules
// ============================================

const FIELD_INFERENCE_RULES: Record<
  string,
  {
    patterns: string[];
    uiComponent: string;
    uiProps: (fieldName: string) => string;
    zodRule: (required: boolean) => string;
    zodUpdateRule: () => string;
    columnRender: (fieldName: string) => string;
  }
> = {
  currency: {
    patterns: ['price', 'amount', 'cost', 'fee', 'total', 'payment', 'salary', 'discount'],
    uiComponent: 'InputNumber',
    uiProps: () =>
      `formatter={(value) => \`¥ \${value}\`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")} parser={(value) => Number(value!.replace(/¥\\s?|(,*)/g, "")) as 0} precision={2} min={0} style={{ width: "100%" }}`,
    zodRule: (required) =>
      required ? 'z.number().min(0, "不能小于0")' : 'z.number().min(0, "不能小于0").optional()',
    zodUpdateRule: () => 'z.number().min(0, "不能小于0").optional()',
    columnRender: (fieldName) =>
      `render: (${fieldName}: number) => ${fieldName} !== undefined ? \`¥\${${fieldName}.toFixed(2)}\` : "-"`,
  },
  email: {
    patterns: ['email', 'mail'],
    uiComponent: 'Input',
    uiProps: () => `type="email" placeholder="请输入邮箱"`,
    zodRule: (required) =>
      required
        ? 'z.string().email("邮箱格式不正确")'
        : 'z.string().email("邮箱格式不正确").optional().or(z.literal(""))',
    zodUpdateRule: () => 'z.string().email("邮箱格式不正确").optional().nullable()',
    columnRender: () => '',
  },
  phone: {
    patterns: ['phone', 'mobile', 'telephone', 'cellphone'],
    uiComponent: 'Input',
    uiProps: () => `type="tel" placeholder="请输入手机号" maxLength={11}`,
    zodRule: (required) =>
      required
        ? 'z.string().regex(/^1[3-9]\\d{9}$/, "手机号格式不正确")'
        : 'z.string().regex(/^1[3-9]\\d{9}$/, "手机号格式不正确").optional().or(z.literal(""))',
    zodUpdateRule: () =>
      'z.string().regex(/^1[3-9]\\d{9}$/, "手机号格式不正确").optional().nullable()',
    columnRender: () => '',
  },
  url: {
    patterns: ['url', 'website', 'link', 'homepage'],
    uiComponent: 'Input',
    uiProps: () => `type="url" placeholder="请输入URL（https://...）"`,
    zodRule: (required) =>
      required
        ? 'z.string().url("URL格式不正确")'
        : 'z.string().url("URL格式不正确").optional().or(z.literal(""))',
    zodUpdateRule: () => 'z.string().url("URL格式不正确").optional().nullable()',
    columnRender: () =>
      `render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">{url}</a> : "-"`,
  },
  slug: {
    patterns: ['slug', 'alias'],
    uiComponent: 'Input',
    uiProps: () =>
      `placeholder="自动生成或手动输入" addonAfter={<Button size="small" type="link">生成</Button>}`,
    zodRule: (required) =>
      required
        ? 'z.string().regex(/^[a-z0-9-]+$/, "只能包含小写字母、数字和连字符")'
        : 'z.string().regex(/^[a-z0-9-]+$/, "只能包含小写字母、数字和连字符").optional()',
    zodUpdateRule: () =>
      'z.string().regex(/^[a-z0-9-]+$/, "只能包含小写字母、数字和连字符").optional()',
    columnRender: () => `render: (val: string) => val ? <Tag>{val}</Tag> : "-"`,
  },
  image: {
    patterns: ['avatar', 'logo', 'icon', 'cover', 'thumbnail', 'image', 'picture', 'photo'],
    uiComponent: 'OSSUpload',
    uiProps: (fieldName) =>
      `type="${fieldName}" accept="image/jpeg,image/png,image/webp" maxFileSize={5 * 1024 * 1024}`,
    zodRule: () => 'z.string().optional()',
    zodUpdateRule: () => 'z.string().nullable().optional()',
    columnRender: (fieldName) =>
      `render: (${fieldName}: string) => ${fieldName} ? <img src={${fieldName}} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "-"`,
  },
  date: {
    patterns: [
      'date',
      'At',
      'Time',
      'deadline',
      'expiredAt',
      'startAt',
      'endAt',
      'beginAt',
      'finishAt',
      'createdAt',
      'updatedAt',
      'publishedAt',
      'dueDate',
    ],
    uiComponent: 'DatePicker',
    uiProps: () => `showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm:ss"`,
    zodRule: (required) => (required ? 'z.date()' : 'z.date().optional()'),
    zodUpdateRule: () => 'z.date().optional().nullable()',
    columnRender: (fieldName) =>
      `render: (${fieldName}: string) => ${fieldName} ? new Date(${fieldName}).toLocaleString("zh-CN") : "-"`,
  },
  percent: {
    patterns: ['rate', 'percent', 'ratio', 'discount'],
    uiComponent: 'InputNumber',
    uiProps: () =>
      `min={0} max={100} precision={2} formatter={(value) => \`\${value}%\`} parser={(value) => Number(value!.replace("%", "")) as 0} style={{ width: "100%" }}`,
    zodRule: (required) =>
      required ? 'z.number().min(0).max(100)' : 'z.number().min(0).max(100).optional()',
    zodUpdateRule: () => 'z.number().min(0).max(100).optional()',
    columnRender: (fieldName) =>
      `render: (${fieldName}: number) => ${fieldName} !== undefined ? \`\${${fieldName}}%\` : "-"`,
  },
  sort: {
    patterns: ['sortOrder', 'priority', 'order', 'sort', 'weight', 'sequence'],
    uiComponent: 'InputNumber',
    uiProps: () => `min={0} style={{ width: "100%" }}`,
    zodRule: (required) =>
      required ? 'z.number().int().min(0)' : 'z.number().int().min(0).optional()',
    zodUpdateRule: () => 'z.number().int().min(0).optional()',
    columnRender: () => '',
  },
  audit: {
    patterns: ['createdById', 'updatedById', 'deletedById'],
    uiComponent: 'Input',
    uiProps: () => `disabled`,
    zodRule: () => 'z.string().optional()',
    zodUpdateRule: () => 'z.string().optional()',
    columnRender: () => '',
  },
};

function inferFieldConfig(field: Field): InferredFieldConfig | null {
  // Skip enum fields - they have their own handling
  if (field.type === 'enum') return null;

  const lowerName = field.name.toLowerCase();

  for (const [ruleName, rule] of Object.entries(FIELD_INFERENCE_RULES)) {
    const matched = rule.patterns.some((pattern) => {
      const lowerPattern = pattern.toLowerCase();
      // Exact match (highest priority)
      if (lowerName === lowerPattern) return true;

      // Suffix match for specific patterns (e.g., "startAt" matches "At")
      if (ruleName === 'date' && lowerName.endsWith(lowerPattern) && pattern.length > 2)
        return true;

      // Word boundary match: field name contains pattern as a distinct word
      // Use regex to ensure we match whole words, not substrings
      const regex = new RegExp(
        `(^|_|)${lowerPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[A-Z]|_)`,
        'i',
      );
      if (regex.test(field.name)) return true;

      return false;
    });

    if (matched) {
      const isAudit = rule.patterns.some((p) => field.name === p);

      return {
        uiComponent: rule.uiComponent,
        uiProps: rule.uiProps(field.name),
        zodValidation: rule.zodRule(field.required),
        formField: '',
        columnRender: rule.columnRender(field.name),
        hideInForm: isAudit,
        hideInTable: isAudit,
        autoInject: isAudit,
      };
    }
  }

  return null;
}

// ============================================
// Phase 2: Relation Field Detection
// ============================================

const RELATION_PATTERNS: {
  suffix: string;
  getModel: (base: string) => string;
  ui: RelationField['uiComponent'];
}[] = [
  // More specific patterns FIRST (before generic *Id)
  { suffix: 'CategoryId', getModel: () => 'Category', ui: 'Select' },
  { suffix: 'ParentId', getModel: () => 'SELF', ui: 'TreeSelect' },
  { suffix: 'UserId', getModel: () => 'User', ui: 'UserSelect' },
  { suffix: 'AuthorId', getModel: () => 'User', ui: 'UserSelect' },
  { suffix: 'AssigneeId', getModel: () => 'User', ui: 'UserSelect' },
  { suffix: 'CustomerId', getModel: () => 'User', ui: 'UserSelect' },
  { suffix: 'MerchantId', getModel: () => 'Merchant', ui: 'Select' },
  { suffix: 'StoreId', getModel: () => 'Store', ui: 'Select' },
  { suffix: 'TemplateId', getModel: () => 'CouponTemplate', ui: 'Select' },
  // Generic *Id pattern LAST (catches remaining *Id fields)
  { suffix: 'Id', getModel: (base) => base, ui: 'Select' },
];

function detectRelationFields(fields: Field[], moduleName: string): RelationField[] {
  const relations: RelationField[] = [];

  for (const field of fields) {
    if (field.type !== 'string' && field.type !== 'number') continue;

    for (const pattern of RELATION_PATTERNS) {
      // Exact match (e.g., field.name === 'categoryId' matches pattern.suffix 'CategoryId')
      if (
        field.name === pattern.suffix ||
        field.name === pattern.suffix.charAt(0).toLowerCase() + pattern.suffix.slice(1)
      ) {
        const isSelfRelation = pattern.getModel(field.name) === 'SELF';
        const model = isSelfRelation ? toPascalCase(moduleName) : pattern.getModel(field.name);

        relations.push({
          field: field.name,
          model,
          type: 'belongsTo',
          uiComponent: pattern.ui,
          foreignKey: field.name,
        });
        break;
      }
    }
  }

  return relations;
}

// ============================================
// Phase 2: UI Pattern Selection
// ============================================

function selectUIPattern(fields: Field[], moduleName: string): UIPatternConfig {
  const hasRichText = fields.some(
    (f) =>
      f.type === 'text' &&
      ['content', 'body', 'description', 'detail'].includes(f.name.toLowerCase()),
  );
  const hasStateMachine = fields.some((f) => f.type === 'enum' && f.enum && f.enum.length >= 4);
  const hasTreeStructure = fields.some((f) => f.name === 'parentId');
  const hasMultipleImages = fields.some(
    (f) => f.name === 'images' || f.name === 'gallery' || f.name === 'photos',
  );

  if (hasRichText) {
    return {
      pattern: 'separate',
      pages: ['ListPage', 'CreatePage', 'EditPage', 'DetailPage'],
      reason: '富文本编辑器不适合 Modal，需要独立页面',
    };
  }

  if (hasStateMachine) {
    return {
      pattern: 'separate',
      pages: ['ListPage', 'DetailPage'],
      reason: '状态机模块需要详情页展示状态流转历史',
    };
  }

  if (hasTreeStructure) {
    return {
      pattern: 'modal',
      pages: ['ListPage'],
      reason: '树形结构使用 Modal 快速编辑',
    };
  }

  if (hasMultipleImages) {
    return {
      pattern: 'modal',
      pages: ['ListPage'],
      reason: '多图上传适合 Modal 快速编辑',
    };
  }

  return {
    pattern: 'modal',
    pages: ['ListPage'],
    reason: 'Modal 模式最简洁，适合标准 CRUD',
  };
}

// ============================================
// String Utilities
// ============================================

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const IRREGULAR_PLURALS: Record<string, string> = {
  person: 'people',
  child: 'children',
  man: 'men',
  woman: 'women',
  tooth: 'teeth',
  foot: 'feet',
  goose: 'geese',
  mouse: 'mice',
  louse: 'lice',
  ox: 'oxen',
  datum: 'data',
  medium: 'media',
  criterion: 'criteria',
  phenomenon: 'phenomena',
  axis: 'axes',
  analysis: 'analyses',
  basis: 'bases',
  crisis: 'crises',
  diagnosis: 'diagnoses',
  hypothesis: 'hypotheses',
  oasis: 'oases',
  parenthesis: 'parentheses',
  thesis: 'theses',
};

function toPlural(str: string): string {
  const lower = str.toLowerCase();
  if (IRREGULAR_PLURALS[lower]) {
    const plural = IRREGULAR_PLURALS[lower];
    return str[0] === str[0].toUpperCase()
      ? plural.charAt(0).toUpperCase() + plural.slice(1)
      : plural;
  }
  if (str.endsWith('fe')) return str.slice(0, -2) + 'ves';
  if (str.endsWith('f')) return str.slice(0, -1) + 'ves';
  if (str.endsWith('is') && str.length > 2) return str.slice(0, -2) + 'es';
  if (str.endsWith('on') && !str.endsWith('ion')) return str.slice(0, -2) + 'a';
  if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) return str.slice(0, -1) + 'ies';
  if (
    str.endsWith('s') ||
    str.endsWith('x') ||
    str.endsWith('z') ||
    str.endsWith('ch') ||
    str.endsWith('sh')
  ) {
    return str + 'es';
  }
  return str + 's';
}

function toLabel(str: string): string {
  const result = str.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// ============================================
// Pattern Detection
// ============================================

function detectPattern(moduleName: string): BusinessPattern | null {
  const lowerName = moduleName.toLowerCase();
  for (const pattern of BUSINESS_PATTERNS) {
    if (pattern.keywords.some((keyword) => lowerName.includes(keyword) || lowerName === keyword)) {
      return pattern;
    }
  }
  return null;
}

function getFieldsForModule(moduleName: string, customFields?: Field[]): Field[] {
  if (customFields && customFields.length > 0) {
    return customFields;
  }

  const pattern = detectPattern(moduleName);
  if (pattern) {
    console.log(`\x1b[36m%s\x1b[0m`, `✓ Detected business pattern: ${pattern.name}`);
    return pattern.fields;
  }

  return [
    { name: 'name', type: 'string', required: true },
    { name: 'description', type: 'text', required: false },
    { name: 'status', type: 'enum', required: true, enum: ['ACTIVE', 'INACTIVE'] },
  ];
}

// ============================================
// Code Generators
// ============================================

function generatePrismaSchema(
  moduleName: string,
  fields: Field[],
  relations: RelationField[],
): string {
  const pascalName = toPascalCase(moduleName);

  let schema = `\nmodel ${pascalName} {\n`;
  schema += `  id        String   @id @default(cuid())\n`;

  for (const field of fields) {
    const isRelation = relations.some((r) => r.field === field.name);
    const prismaType = field.enum ? 'String' : PRISMA_TYPE_MAP[field.type];
    const optional = field.required ? '' : '?';
    const comment = field.enum ? ` // ${field.enum.join(', ')}` : '';
    schema += `  ${field.name.padEnd(20)} ${prismaType}${optional.padEnd(1)}${comment}\n`;
  }

  // Add Prisma relation fields
  for (const relation of relations) {
    const relationName = relation.field.replace(/Id$/, '');
    const pascalRelation = toPascalCase(relationName);
    schema += `  ${relationName.padEnd(20)} ${relation.model}${relation.type === 'hasMany' ? '[]' : '?'} @relation(fields: [${relation.field}], references: [id])\n`;
  }

  schema += `  priority  Int      @default(2)\n`;
  schema += `  createdAt DateTime @default(now())\n`;
  schema += `  updatedAt DateTime @updatedAt\n`;
  schema += `}\n`;

  return schema;
}

function generateZodSchemas(moduleName: string, fields: Field[]): string {
  const pascalName = toPascalCase(moduleName);

  let output = `\n// ============================================\n`;
  output += `// ${pascalName} Schemas\n`;
  output += `// ============================================\n\n`;

  // Create schema - with smart validation
  output += `export const ${pascalName}Schema = {\n`;
  output += `  createInput: z.object({\n`;
  for (const field of fields) {
    if (field.name === 'id') continue;
    const inferred = inferFieldConfig(field);
    let zodType: string;

    if (inferred && inferred.zodValidation) {
      zodType = inferred.zodValidation;
    } else if (field.enum) {
      zodType = `z.enum([${field.enum.map((e) => `"${e}"`).join(', ')}])`;
      if (!field.required) zodType += '.optional()';
    } else {
      zodType = getBaseZodType(field.type);
      if (!field.required) zodType += '.optional()';
    }

    output += `    ${field.name}: ${zodType},\n`;
  }
  output += `  }),\n\n`;

  // Update schema - data part only (id is handled by tRPC helper wrapper)
  output += `  // updateInput is the data part only (id is handled by tRPC helper wrapper)\n`;
  output += `  updateInput: z.object({\n`;
  for (const field of fields) {
    if (field.name === 'id') continue;

    let zodType: string;

    if (field.type === 'enum') {
      zodType = `z.enum([${field.enum!.map((e) => `"${e}"`).join(', ')}]).optional()`;
    } else {
      const inferred = inferFieldConfig(field);
      if (inferred) {
        // Find matching update-specific validation
        const lowerName = field.name.toLowerCase();
        let matched = false;
        for (const [, rule] of Object.entries(FIELD_INFERENCE_RULES)) {
          const lowerPattern = rule.patterns[0].toLowerCase();
          const regex = new RegExp(
            `(^|_|)${lowerPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[A-Z]|_)`,
            'i',
          );
          if (regex.test(field.name) || lowerName === lowerPattern) {
            zodType = rule.zodUpdateRule();
            matched = true;
            break;
          }
        }
        if (!matched) {
          zodType = getBaseZodUpdateType(field);
        }
      } else {
        zodType = getBaseZodUpdateType(field);
      }
    }

    output += `    ${field.name}: ${zodType},\n`;
  }
  output += `  }),\n\n`;

  // Standard CRUD schemas
  output += `  getOneInput: z.object({ id: z.string() }),\n`;
  output += `  getManyInput: z.object({\n`;
  output += `    page: z.number().optional().default(1),\n`;
  output += `    limit: z.number().optional().default(10),\n`;
  output += `  }),\n`;
  output += `  deleteInput: z.object({ id: z.string() }),\n`;
  output += `};\n`;

  return output;
}

function getBaseZodType(type: string): string {
  const map: Record<string, string> = {
    string: 'z.string().min(1, "不能为空")',
    text: 'z.string()',
    number: 'z.number()',
    float: 'z.number()',
    boolean: 'z.boolean()',
    date: 'z.date()',
    image: 'z.string()',
    file: 'z.string()',
  };
  return map[type] || 'z.string()';
}

function getBaseZodUpdateType(field: Field): string {
  if (!field.required && (field.type === 'string' || field.type === 'text')) {
    return 'z.string().nullable().optional()';
  }
  const map: Record<string, string> = {
    string: 'z.string().optional()',
    text: 'z.string().nullable().optional()',
    number: 'z.number().optional()',
    float: 'z.number().optional()',
    boolean: 'z.boolean().optional()',
    date: 'z.date().optional().nullable()',
    image: 'z.string().nullable().optional()',
    file: 'z.string().nullable().optional()',
  };
  return map[field.type] || 'z.string().optional()';
}

function generateTRPCRouter(moduleName: string): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);

  return `import { createCrudRouter } from '../../../trpc/trpc.helper';
import { ${pascalName}Schema } from '@loom/shared';

export const ${camelName}Router = createCrudRouter(
  '${pascalName}',
  {
    create: ${pascalName}Schema.createInput,
    update: ${pascalName}Schema.updateInput,
    getMany: ${pascalName}Schema.getManyInput,
    getOne: ${pascalName}Schema.getOneInput,
  }
);
`;
}

function generateRouterSpec(moduleName: string): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);

  return `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPrismaMock } from '../../../../test/prisma-mock';
import { ${camelName}Router } from './${camelName}.router';

function createTestCaller(user: any = null) {
  const prisma = createPrismaMock(['${camelName}']);
  const ctx = {
    prisma,
    fileStorage: { upload: vi.fn(), delete: vi.fn(), getSignedUrl: vi.fn(), getUploadCredentials: vi.fn() },
    app: null,
    req: { headers: {}, socket: { remoteAddress: '127.0.0.1' } },
    res: {},
    user,
  };
  return { caller: ${camelName}Router.createCaller(ctx), prisma };
}

describe('${pascalName}Router', () => {
  let caller: any;
  let prisma: any;

  describe('getMany', () => {
    it('returns paginated items', async () => {
      const items = [{ id: '1', name: 'Test' }];
      const result = createTestCaller({ id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.${camelName}.findMany.mockResolvedValue(items);
      prisma.${camelName}.count.mockResolvedValue(1);

      const res = await caller.getMany({ page: 1, limit: 10 });
      expect(res.items).toEqual(items);
      expect(res.total).toBe(1);
    });
  });

  describe('getOne', () => {
    it('returns a record by ID', async () => {
      const record = { id: '1', name: 'Test' };
      const result = createTestCaller({ id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.${camelName}.findUnique.mockResolvedValue(record);

      const res = await caller.getOne({ id: '1' });
      expect(res).toEqual(record);
    });
  });

  describe('create', () => {
    it('creates a record', async () => {
      const created = { id: '1', name: 'New' };
      const result = createTestCaller({ id: 'user-1', type: 'admin' });
      caller = result.caller;
      prisma = result.prisma;

      prisma.${camelName}.create.mockResolvedValue(created);

      const res = await caller.create({ data: { name: 'New' } });
      expect(res).toEqual(created);
    });
  });
});
`;
}

function generateFrontendListPage(
  moduleName: string,
  fields: Field[],
  relations: RelationField[],
  uiPattern: UIPatternConfig,
): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const moduleLabel = toLabel(moduleName);
  const pluralLabel = toLabel(pluralName);

  // Generate smart columns
  const columns = generateSmartColumns(fields, moduleName);
  // Generate smart form fields
  const formFields = generateSmartFormFields(fields, relations, moduleName);
  // Numeric fields list for value conversion
  const numericFields = fields
    .filter((f) => f.type === 'number' || f.type === 'float')
    .map((f) => `'${f.name}'`)
    .join(', ');

  // Check if we need special imports
  const needsDatePicker = fields.some(
    (f) => f.type === 'date' || inferFieldConfig(f)?.uiComponent === 'DatePicker',
  );
  const needsInputNumber = fields.some((f) => inferFieldConfig(f)?.uiComponent === 'InputNumber');
  const needsOSSUpload = fields.some((f) => inferFieldConfig(f)?.uiComponent === 'OSSUpload');
  const needsTreeSelect = relations.some((r) => r.uiComponent === 'TreeSelect');
  const needsTag = columns.includes('<Tag');

  const extraImports: string[] = [];
  if (needsDatePicker) extraImports.push('DatePicker');
  if (needsInputNumber) extraImports.push('InputNumber');
  if (needsTag) extraImports.push('Tag');
  if (needsTreeSelect) extraImports.push('TreeSelect');
  const antdImports = [
    'Table',
    'Button',
    'Modal',
    'Form',
    'Input',
    'Select',
    'Space',
    'message',
    ...extraImports,
  ];
  if (!antdImports.includes('Tag')) antdImports.push('Tag');

  const extraComponentImports: string[] = [];
  if (needsOSSUpload)
    extraComponentImports.push(`import { OSSUpload } from "../../shared/components/OSSUpload";`);

  return `import { useList, useCreate, useUpdate } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { ${[...new Set(antdImports)].join(', ')} } from "antd";
import { useState } from "react";
${extraComponentImports.join('\n')}

export const ${pascalName}ListPage = () => {
  const { result, query } = useList({
    resource: "${camelName}",
    pagination: {
      pageSize: 10,
    },
  });

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

${columns}
  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Remove id field from values (it's handled separately by dataProvider)
      const { id, ...dataValues } = values;

      // Convert string to number for numeric fields (Ant Design Input type="number" returns string)
      const numericFields = [${numericFields}];
      const processedValues = { ...dataValues };
      numericFields.forEach((field: string) => {
        if (processedValues[field] !== undefined && processedValues[field] !== null) {
          processedValues[field] = Number(processedValues[field]);
        }
      });

${generateRelationDataFetching(relations)}
      if (editingRecord) {
        update(
          {
            resource: "${camelName}",
            id: editingRecord.id,
            values: processedValues,
          },
          {
            onSuccess: () => {
              message.success("更新成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: () => {
              message.error("更新失败");
            },
          }
        );
      } else {
        create(
          {
            resource: "${camelName}",
            values: processedValues,
          },
          {
            onSuccess: () => {
              message.success("创建成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: () => {
              message.error("创建失败");
            },
          }
        );
      }
    } catch (error) {
      console.error("Form validation error:", error);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <List>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>${pluralLabel}</h1>
          <Button type="primary" onClick={handleCreate}>
            + 新建${moduleLabel}
          </Button>
        </div>
        <Table
          columns={[...allColumns, {
            title: "操作",
            key: "actions",
            render: (_: any, record: any) => (
              <Space>
                <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
              </Space>
            ),
          }]}
          rowKey="id"
          dataSource={result?.data || []}
          loading={query.isLoading}
          pagination={{
            current: 1,
            pageSize: 10,
            total: result?.total || 0,
            showSizeChanger: true,
          }}
        />

        <Modal
          title={editingRecord ? "编辑${moduleLabel}" : "新建${moduleLabel}"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
${formFields}
          </Form>
        </Modal>
      </List>
    </div>
  );
};
`;
}

function generateSmartColumns(fields: Field[], moduleName: string): string {
  let columns = '  const allColumns = [';

  for (const field of fields) {
    if (field.name === 'id') continue;

    const inferred = inferFieldConfig(field);
    const label = toLabel(field.name);

    // Skip audit fields in table
    if (inferred?.hideInTable) continue;

    if (field.type === 'boolean') {
      columns += `\n    { title: "${label}", dataIndex: "${field.name}", render: (val: boolean) => val ? <Tag color="green">是</Tag> : <Tag color="default">否</Tag> },`;
    } else if (field.type === 'enum') {
      columns += `\n    { title: "${label}", dataIndex: "${field.name}", render: (status: string) => {`;
      columns += `\n      const colors: Record<string, string> = {`;
      const enumValues = field.enum || [];
      for (let i = 0; i < enumValues.length; i++) {
        columns += `\n        ${enumValues[i]}: "${['orange', 'green', 'blue', 'red'][i % 4]}",`;
      }
      columns += `\n      };`;
      columns += `\n      return <Tag color={colors[status] || 'gray'}>{status}</Tag>;`;
      columns += `\n    } },`;
    } else if (inferred?.columnRender) {
      columns += `\n    { title: "${label}", dataIndex: "${field.name}", ${inferred.columnRender} },`;
    } else if (field.type === 'text') {
      columns += `\n    { title: "${label}", dataIndex: "${field.name}", render: (val: string) => val ? val.substring(0, 50) + (val.length > 50 ? "..." : "") : "-" },`;
    } else {
      columns += `\n    { title: "${label}", dataIndex: "${field.name}" },`;
    }
  }

  columns += `\n  ];\n\n`;
  return columns;
}

function generateSmartFormFields(
  fields: Field[],
  relations: RelationField[],
  moduleName: string,
): string {
  let formFields = '';

  for (const field of fields) {
    if (field.name === 'id') continue;

    const inferred = inferFieldConfig(field);
    const label = toLabel(field.name);
    const required = field.required
      ? ` rules={[{ required: true, message: "请输入${label}" }]}`
      : '';

    // Skip audit / auto-inject fields
    if (inferred?.hideInForm) continue;

    // Check if this is a relation field
    const relation = relations.find((r) => r.field === field.name);
    if (relation) {
      formFields += generateRelationFormField(relation, field);
      continue;
    }

    // Use inferred UI component
    if (inferred?.uiComponent === 'InputNumber') {
      formFields += `            <Form.Item name="${field.name}" label="${label}"${required}>\n`;
      formFields += `              <InputNumber ${inferred.uiProps} />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (inferred?.uiComponent === 'DatePicker') {
      formFields += `            <Form.Item name="${field.name}" label="${label}"${required}>\n`;
      formFields += `              <DatePicker ${inferred.uiProps} />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (inferred?.uiComponent === 'OSSUpload') {
      formFields += `            <Form.Item name="${field.name}" label="${label}">\n`;
      formFields += `              <OSSUpload ${inferred.uiProps} />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (field.type === 'boolean') {
      formFields += `            <Form.Item name="${field.name}" label="${label}" valuePropName="checked">\n`;
      formFields += `              <Switch />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (field.type === 'text') {
      formFields += `            <Form.Item name="${field.name}" label="${label}">\n`;
      formFields += `              <Input.TextArea placeholder="请输入${label}" rows={3} />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (field.type === 'float' || field.type === 'number') {
      formFields += `            <Form.Item name="${field.name}" label="${label}"${required}>\n`;
      formFields += `              <InputNumber min={0} style={{ width: "100%" }} placeholder="请输入${label}" />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (field.enum) {
      formFields += `            <Form.Item name="${field.name}" label="${label}"${required} initialValue="${field.enum![0]}">\n`;
      formFields += `              <Select placeholder="请选择${label}">\n`;
      for (const val of field.enum) {
        formFields += `                <Select.Option value="${val}">${val}</Select.Option>\n`;
      }
      formFields += `              </Select>\n`;
      formFields += `            </Form.Item>\n`;
    } else {
      formFields += `            <Form.Item name="${field.name}" label="${label}"${required}>\n`;
      formFields += `              <Input ${inferred?.uiProps || `placeholder="请输入${label}"`} />\n`;
      formFields += `            </Form.Item>\n`;
    }
  }

  return formFields;
}

function generateRelationFormField(relation: RelationField, field: Field): string {
  const label = toLabel(relation.field.replace(/Id$/, ''));
  const required = field.required ? ` rules={[{ required: true, message: "请选择${label}" }]}` : '';

  if (relation.uiComponent === 'TreeSelect') {
    return `            <Form.Item name="${relation.field}" label="${label}">
              <TreeSelect
                placeholder="选择父级"
                treeData={treeData}
                allowClear
                treeDefaultExpandAll
              />
            </Form.Item>\n`;
  }

  if (relation.uiComponent === 'UserSelect') {
    return `            <Form.Item name="${relation.field}" label="${label}"${required}>
              <Select
                showSearch
                placeholder="选择用户"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* TODO: 从 API 加载用户列表 */}
              </Select>
            </Form.Item>\n`;
  }

  // Default Select for belongsTo relations
  return `            <Form.Item name="${relation.field}" label="${label}"${required}>
              <Select
                showSearch
                placeholder="选择${toLabel(relation.model)}"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* TODO: 从 API 加载${toLabel(relation.model)}列表 */}
              </Select>
            </Form.Item>\n`;
}

function generateRelationDataFetching(relations: RelationField[]): string {
  if (relations.length === 0) return '';

  let code = '';
  for (const relation of relations) {
    if (relation.uiComponent === 'TreeSelect') {
      code += `      // TODO: Load tree data for ${relation.model}\n`;
      code += `      // const { data: treeData } = useList({ resource: "${relation.model.toLowerCase()}" });\n`;
    }
  }
  return code;
}

// ============================================
// Validation & Idempotency
// ============================================

const RESERVED_NAMES = [
  'admin',
  'auth',
  'user',
  'role',
  'permission',
  'upload',
  'payment',
  'wechat',
  'agents',
  'config',
  'system',
  'common',
  'shared',
  'base',
  'prisma',
  'trpc',
  'health',
];

function validateModuleName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('模块名不能为空');
  }
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`模块名 "${name}" 不合法：只能包含小写字母、数字和连字符，且以字母开头`);
  }
  if (name.length > 50) {
    throw new Error(`模块名过长（最多 50 字符）`);
  }
  if (RESERVED_NAMES.includes(name.toLowerCase())) {
    throw new Error(`模块名 "${name}" 是系统保留名，请使用其他名称`);
  }
}

function checkModuleExists(moduleName: string): { exists: boolean; locations: string[] } {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const locations: string[] = [];

  // Check Prisma schema
  const schemaPath = getFilePath('infra/database/prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    if (schemaContent.includes(`model ${pascalName}`)) {
      locations.push(`Prisma schema (model ${pascalName})`);
    }
  }

  // Check tRPC router
  const routerPath = getFilePath(`apps/api/src/modules/${moduleName}/trpc/${camelName}.router.ts`);
  if (fs.existsSync(routerPath)) {
    locations.push(`tRPC router (${routerPath})`);
  }

  // Check frontend page
  const listPagePath = getFilePath(
    `apps/admin/src/modules/${moduleName}/pages/${pascalName}ListPage.tsx`,
  );
  if (fs.existsSync(listPagePath)) {
    locations.push(`Frontend list page (${listPagePath})`);
  }

  // Check Zod schema
  const sharedIndexPath = getFilePath('infra/shared/src/index.ts');
  if (fs.existsSync(sharedIndexPath)) {
    const sharedContent = fs.readFileSync(sharedIndexPath, 'utf-8');
    if (sharedContent.includes(`${pascalName}Schema`)) {
      locations.push(`Zod schema (${pascalName}Schema)`);
    }
  }

  // Check NestJS Module
  const nestModulePath = getFilePath(`apps/api/src/modules/${moduleName}/module.ts`);
  if (fs.existsSync(nestModulePath)) {
    locations.push(`NestJS Module (${nestModulePath})`);
  }

  // Check Miniapp API client
  const miniappApiPath = getFilePath(`apps/miniapp/src/api/${camelName}.ts`);
  if (fs.existsSync(miniappApiPath)) {
    locations.push(`Miniapp API client (${miniappApiPath})`);
  }

  return { exists: locations.length > 0, locations };
}

function validateProjectStructure(): void {
  const requiredPaths = [
    'infra/database/prisma/schema.prisma',
    'infra/shared/src/index.ts',
    'apps/api/src/trpc/app.router.ts',
    'apps/api/src/app.module.ts',
    'apps/admin/src/App.tsx',
    'apps/admin/src/shared/layouts/AdminLayout.tsx',
  ];
  const missing = requiredPaths.filter((p) => !fs.existsSync(getFilePath(p)));
  if (missing.length > 0) {
    throw new Error(
      `项目结构不完整，缺少以下文件：\n${missing.map((p) => `  - ${p}`).join('\n')}\n请确认在正确的项目根目录运行此脚本`,
    );
  }
}

// ============================================
// File Operations (with rollback support)
// ============================================

const PROJECT_ROOT = path.join(__dirname, '../../../..');

interface FileOperation {
  type: 'create' | 'append' | 'modify';
  path: string;
  originalContent?: string; // for rollback
}

const fileOperations: FileOperation[] = [];

function getFilePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

// Memory registry path (user-level, not in git)
function getMemoryRegistryPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.claude/projects/-Users-xinnix-code-loom/memory/module-registry.md');
}

function updateMemoryRegistry(moduleName: string): void {
  const memoryPath = getMemoryRegistryPath();
  if (!fs.existsSync(memoryPath)) return; // Memory not initialized, skip silently

  try {
    const pascalName = toPascalCase(moduleName);
    const camelName = toCamelCase(moduleName);
    let content = fs.readFileSync(memoryPath, 'utf-8');

    // Check if module already registered
    if (content.includes(`| ${moduleName} |`)) return;

    // Add to backend modules table (after wechat row)
    const backendRow = `| ${moduleName} | ${pascalName} | ${camelName}Router | genModule | |`;
    content = content.replace(/(\| wechat\s+\|.*\|\n)/, `$1${backendRow}\n`);

    // Add to frontend modules table (after user row)
    const frontendRow = `| ${moduleName} | ${pascalName}ListPage | genModule |`;
    content = content.replace(/(\| user\s+\|.*\|\n)/, `$1${frontendRow}\n`);

    // Add to Prisma Models list
    content = content.replace(
      /(Prisma Models\n\n)/,
      `$1${content.includes(pascalName + ',') ? '' : pascalName + ', '}`,
    );

    fs.writeFileSync(memoryPath, content);
    console.log('\x1b[36m%s\x1b[0m', '  ℹ Memory registry updated');
  } catch (err) {
    // Memory update failure should not block generation
    console.warn('  ⚠ Failed to update memory registry:', (err as Error).message);
  }
}

function appendToFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    const original = fs.readFileSync(filePath, 'utf-8');
    fileOperations.push({ type: 'append', path: filePath, originalContent: original });
    fs.appendFileSync(filePath, content);
  } else {
    fileOperations.push({ type: 'create', path: filePath });
    fs.writeFileSync(filePath, content);
  }
}

function createFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fileOperations.push({ type: 'create', path: filePath });
  fs.writeFileSync(filePath, content);
}

function modifyFile(filePath: string, modifier: (content: string) => string): void {
  const original = fs.readFileSync(filePath, 'utf-8');
  const modified = modifier(original);
  fileOperations.push({ type: 'modify', path: filePath, originalContent: original });
  fs.writeFileSync(filePath, modified);
}

function rollback(): void {
  console.error('\x1b[33m%s\x1b[0m', '\n⏪ Rolling back generated files...');
  // Roll back in reverse order
  for (let i = fileOperations.length - 1; i >= 0; i--) {
    const op = fileOperations[i];
    try {
      if (op.type === 'create') {
        if (fs.existsSync(op.path)) {
          fs.unlinkSync(op.path);
        }
      } else if (op.type === 'append' || op.type === 'modify') {
        if (op.originalContent !== undefined) {
          fs.writeFileSync(op.path, op.originalContent);
        }
      }
    } catch (e) {
      console.error(`  ⚠️ Failed to rollback ${op.path}: ${e}`);
    }
  }
  // Clean up empty directories created during generation
  const createdDirs = new Set<string>();
  for (const op of fileOperations) {
    if (op.type === 'create') {
      const dir = path.dirname(op.path);
      createdDirs.add(dir);
    }
  }
  for (const dir of createdDirs) {
    try {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    } catch {
      /* ignore */
    }
  }
  console.error('\x1b[33m%s\x1b[0m', '⏪ Rollback complete.');
}

function updateAppTsx(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const appPath = getFilePath('apps/admin/src/App.tsx');

  modifyFile(appPath, (content) => {
    // Add import — find last import line and append after it
    const importLine = `import { ${pascalName}ListPage } from "./modules/${moduleName}";`;
    if (!content.includes(importLine)) {
      const importMatch = content.match(/^import .+$/gm);
      if (!importMatch) throw new Error('Cannot find import statements in App.tsx');
      const lastImportText = importMatch[importMatch.length - 1];
      const lastImportIdx = content.lastIndexOf(lastImportText);
      const insertIdx = content.indexOf('\n', lastImportIdx) + 1;
      content = content.slice(0, insertIdx) + importLine + '\n' + content.slice(insertIdx);
    }

    // Add resource — find resources=[...] and insert before the closing ]}
    const resource = `              {\n                name: "${camelName}",\n                list: "/${pluralName}",\n              },`;
    if (!content.includes(`name: "${camelName}"`)) {
      const resourcesMatch = content.match(/resources=\{(\[[\s\S]*?\])\}/);
      if (!resourcesMatch) throw new Error('Cannot find resources={[...]} in App.tsx');
      const resourcesStart = content.indexOf(resourcesMatch[0]);
      const bracketEnd = content.indexOf(']}', resourcesStart);
      if (bracketEnd === -1) throw new Error('Cannot find resources closing ]} in App.tsx');
      content = content.slice(0, bracketEnd) + resource + '\n' + content.slice(bracketEnd);
    }

    // Add route — find the AdminLayout Route group and insert before its closing </Route>
    const route = `                  <Route path="${pluralName}" element={<${pascalName}ListPage />} />\n`;
    if (!content.includes(`<${pascalName}ListPage`)) {
      const layoutRouteMatch = content.match(
        /<Route\s+path="\/"\s+element=\{<AdminLayout[^>]*>[\s\S]*?<\/Route>/,
      );
      if (!layoutRouteMatch) throw new Error('Cannot find AdminLayout Route in App.tsx');
      const layoutRouteStart = content.indexOf(layoutRouteMatch[0]);
      const closingRouteIdx = content.lastIndexOf(
        '</Route>',
        layoutRouteStart + layoutRouteMatch[0].length,
      );
      if (closingRouteIdx === -1)
        throw new Error('Cannot find closing </Route> for AdminLayout in App.tsx');
      content = content.slice(0, closingRouteIdx) + route + content.slice(closingRouteIdx);
    }

    return content;
  });
}

function updateAppRouter(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const routerPath = getFilePath('apps/api/src/trpc/app.router.ts');

  modifyFile(routerPath, (content) => {
    // Add import — find last import line
    const importLine = `import { ${camelName}Router } from "../modules/${moduleName}/trpc/${camelName}.router";`;
    if (!content.includes(importLine)) {
      const importMatch = content.match(/^import .+$/gm);
      if (!importMatch) throw new Error('Cannot find import statements in app.router.ts');
      const lastImportText = importMatch[importMatch.length - 1];
      const lastImportIdx = content.lastIndexOf(lastImportText);
      const insertIdx = content.indexOf('\n', lastImportIdx) + 1;
      content = content.slice(0, insertIdx) + importLine + '\n' + content.slice(insertIdx);
    }

    // Add router entry — find export const appRouter = mergeRouters(...) and insert before closing }
    const routerLine = `  ${camelName}: ${camelName}Router,`;
    if (!content.includes(`${camelName}:`)) {
      const routerMatch = content.match(/export const appRouter\s*=\s*mergeRouters\([\s\S]*?\)/);
      if (!routerMatch) throw new Error('Cannot find appRouter definition in app.router.ts');
      // Find the object literal inside the merged router
      const objEndMatch = content.match(/export const appRouter[\s\S]*?(\n\};)/);
      if (objEndMatch) {
        const objEndIdx = content.indexOf(objEndMatch[1]);
        content = content.slice(0, objEndIdx) + routerLine + '\n' + content.slice(objEndIdx);
      } else {
        // Fallback: find the last } after appRouter
        const appRouterIdx = content.indexOf('export const appRouter');
        const lastBrace = content.lastIndexOf(
          '}',
          content.indexOf('\n\n', appRouterIdx) || content.length,
        );
        if (lastBrace === -1)
          throw new Error('Cannot find router object closing } in app.router.ts');
        content = content.slice(0, lastBrace) + routerLine + '\n' + content.slice(lastBrace);
      }
    }

    return content;
  });
}

function updateAdminLayout(moduleName: string): void {
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const layoutPath = getFilePath('apps/admin/src/shared/layouts/AdminLayout.tsx');

  modifyFile(layoutPath, (content) => {
    const menuItem = `    { key: "/${pluralName}", label: "${toLabel(moduleName)}管理", icon: "FolderOutlined" },`;

    if (!content.includes(`key: "/${pluralName}"`)) {
      // Find the menuConfig array and append to the last children group
      const menuConfigMatch = content.match(/const menuConfig\s*=\s*\[([\s\S]*?)\];/);
      if (!menuConfigMatch) throw new Error('Cannot find menuConfig in AdminLayout.tsx');

      // Find the last children: [...] array within menuConfig and append there
      const menuConfigStart = content.indexOf(menuConfigMatch[0]);
      const menuConfigEnd = menuConfigStart + menuConfigMatch[0].length;

      // Find the last children array end (]);) within menuConfig
      const menuConfigBlock = content.slice(menuConfigStart, menuConfigEnd);
      const childrenEndMatch = [...menuConfigBlock.matchAll(/\];/g)];
      if (childrenEndMatch.length === 0)
        throw new Error('Cannot find children array in menuConfig');

      const lastChildrenEnd = childrenEndMatch[childrenEndMatch.length - 1];
      const insertOffset = menuConfigStart + lastChildrenEnd.index!;
      content = content.slice(0, insertOffset) + '\n' + menuItem + content.slice(insertOffset);
    }

    return content;
  });
}

function createModuleIndex(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const indexContent = `// apps/admin/src/modules/${moduleName}/index.ts
export { ${pascalName}ListPage } from "./pages/${pascalName}ListPage";
`;

  const indexPath = getFilePath(`apps/admin/src/modules/${moduleName}/index.ts`);
  createFile(indexPath, indexContent);
}

// ============================================
// Miniapp API Client Generation
// ============================================

function generateMiniappApiClient(moduleName: string, fields: Field[]): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const label = toLabel(moduleName);

  const interfaceFields = fields
    .map((f) => {
      const tsType =
        f.type === 'number' || f.type === 'float'
          ? 'number'
          : f.type === 'boolean'
            ? 'boolean'
            : f.type === 'date'
              ? 'string'
              : 'string';
      const optional = f.required ? '' : '?';
      return `  ${f.name}${optional}: ${tsType};`;
    })
    .join('\n');

  return `/**
 * ${label} 相关 API
 */
import { http } from '@/utils/http';
import { API_ENDPOINTS } from '@/config/api';

export interface ${pascalName} {
  id: string;
${interfaceFields}
  createdAt: string;
  updatedAt: string;
}

export interface ${pascalName}ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const ${camelName}Api = {
  /** 获取${label}列表 */
  getList: (params?: ${pascalName}ListParams) =>
    http.get<${pascalName}[]>(API_ENDPOINTS.${camelName}List, params, { showLoading: true }),

  /** 获取${label}详情 */
  getDetail: (id: string) =>
    http.get<${pascalName}>(API_ENDPOINTS.${camelName}Detail(id)),

  /** 创建${label} */
  create: (data: Omit<${pascalName}, 'id' | 'createdAt' | 'updatedAt'>) =>
    http.post<${pascalName}>(API_ENDPOINTS.${camelName}List, data),

  /** 更新${label} */
  update: (id: string, data: Partial<Omit<${pascalName}, 'id' | 'createdAt' | 'updatedAt'>>) =>
    http.put<${pascalName}>(API_ENDPOINTS.${camelName}Detail(id), data),

  /** 删除${label} */
  delete: (id: string) =>
    http.delete(API_ENDPOINTS.${camelName}Detail(id)),
};
`;
}

function updateMiniappApiConfig(moduleName: string): void {
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const pascalName = toPascalCase(moduleName);
  const configPath = getFilePath('apps/miniapp/src/config/api.ts');

  modifyFile(configPath, (content) => {
    if (content.includes(`${camelName}List:`)) return content;

    const endpointLines = `  // ${pascalName} 相关
  ${camelName}List: '/${pluralName}',
  ${camelName}Detail: (id: string) => \`/${pluralName}/\${id}\`,`;

    const closingMatch = content.lastIndexOf('} as const');
    if (closingMatch === -1) throw new Error('Cannot find API_ENDPOINTS closing in miniapp config');

    content = content.slice(0, closingMatch) + endpointLines + '\n' + content.slice(closingMatch);
    return content;
  });
}

function updateMiniappApiIndex(moduleName: string): void {
  const camelName = toCamelCase(moduleName);
  const indexPath = getFilePath('apps/miniapp/src/api/index.ts');

  modifyFile(indexPath, (content) => {
    const exportLine = `export * from './${camelName}';`;
    if (content.includes(exportLine)) return content;
    return content.trimEnd() + '\n' + exportLine + '\n';
  });
}

function generateNestModule(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const moduleContent = `import { Module } from '@nestjs/common';

@Module({
  providers: [],
  exports: [],
})
export class ${pascalName}Module {}
`;

  const modulePath = getFilePath(`apps/api/src/modules/${moduleName}/module.ts`);
  createFile(modulePath, moduleContent);
}

function updateAppModule(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const modulePath = getFilePath('apps/api/src/app.module.ts');

  modifyFile(modulePath, (content) => {
    const importLine = `import { ${pascalName}Module } from "./modules/${moduleName}/module";`;

    // Add import after last module import
    if (!content.includes(importLine)) {
      const moduleImportMatches = [...content.matchAll(/^import .+from "\.\/modules\/.+";$/gm)];
      if (moduleImportMatches.length === 0) {
        throw new Error('Cannot find module imports in app.module.ts');
      }
      const lastImport = moduleImportMatches[moduleImportMatches.length - 1];
      const insertIdx = lastImport.index! + lastImport[0].length;
      content = content.slice(0, insertIdx) + '\n' + importLine + content.slice(insertIdx);
    }

    // Add to imports array
    const moduleLine = `    ${pascalName}Module,`;
    if (!content.includes(`${pascalName}Module,`)) {
      const moduleInImportsMatches = [...content.matchAll(/^\s+\w+Module,$/gm)];
      if (moduleInImportsMatches.length === 0) {
        throw new Error('Cannot find module entries in imports array');
      }
      const lastModule = moduleInImportsMatches[moduleInImportsMatches.length - 1];
      const insertIdx = lastModule.index! + lastModule[0].length;
      content = content.slice(0, insertIdx) + '\n' + moduleLine + content.slice(insertIdx);
    }

    return content;
  });
}

// ============================================
// Main Generation Function
// ============================================

export async function generateModule(options: GenerateOptions): Promise<void> {
  const { moduleName, fields: customFields, fileUpload, dryRun } = options;
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);

  // Validate module name
  validateModuleName(moduleName);

  // Validate project structure
  validateProjectStructure();

  // Idempotency check
  const existing = checkModuleExists(moduleName);
  if (existing.exists) {
    console.error('\x1b[31m%s\x1b[0m', `\n❌ 模块 "${pascalName}" 已存在！`);
    console.error('  已存在的部分：');
    existing.locations.forEach((loc) => console.error(`    - ${loc}`));
    console.error('\n  请先使用 /deleteModule 删除旧模块，或使用不同的模块名。');
    process.exit(1);
  }

  console.log('\x1b[35m%s\x1b[0m', `\n🚀 Generating module: ${pascalName}\n`);
  console.log('%s', '━'.repeat(50));

  // Step 1: Get fields
  const fields = getFieldsForModule(moduleName, customFields);
  console.log('\x1b[36m%s\x1b[0m', `\n📋 Fields (${fields.length}):`);
  fields.forEach((f) => {
    const inferred = inferFieldConfig(f);
    const badge = inferred ? ` \x1b[32m[${inferred.uiComponent}]\x1b[0m` : '';
    console.log(`   - ${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}${badge}`);
  });

  // Step 2: Detect relations
  const relations = detectRelationFields(fields, moduleName);
  if (relations.length > 0) {
    console.log('\x1b[36m%s\x1b[0m', `\n🔗 Relations (${relations.length}):`);
    relations.forEach((r) => console.log(`   - ${r.field} → ${r.model} (${r.uiComponent})`));
  }

  // Step 3: Select UI pattern
  const uiPattern = selectUIPattern(fields, moduleName);
  console.log('\x1b[36m%s\x1b[0m', `\n🎨 UI Pattern: ${uiPattern.pattern}`);
  console.log(`   Reason: ${uiPattern.reason}`);

  if (dryRun) {
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  Dry run mode - no files will be created');
    console.log('\n📋 Generated Zod Schema Preview:');
    console.log(generateZodSchemas(moduleName, fields));
    return;
  }

  try {
    // Step 4: Generate Prisma Schema
    console.log('\x1b[32m%s\x1b[0m', '✓ Generating Prisma schema...');
    const prismaSchema = generatePrismaSchema(moduleName, fields, relations);
    const schemaPath = getFilePath('infra/database/prisma/schema.prisma');
    appendToFile(schemaPath, prismaSchema);

    // Step 5: Generate Zod Schemas (with smart validation)
    console.log('\x1b[32m%s\x1b[0m', '✓ Generating Zod schemas (smart validation)...');
    const zodSchemas = generateZodSchemas(moduleName, fields);
    const sharedIndexPath = getFilePath('infra/shared/src/index.ts');
    appendToFile(sharedIndexPath, zodSchemas);

    // Step 6: Generate tRPC Router
    console.log('\x1b[32m%s\x1b[0m', '✓ Generating tRPC router...');
    const trpcRouter = generateTRPCRouter(moduleName);
    const routerPath = getFilePath(
      `apps/api/src/modules/${moduleName}/trpc/${camelName}.router.ts`,
    );
    createFile(routerPath, trpcRouter);

    // Step 6.5: Generate Router Test
    console.log('\x1b[32m%s\x1b[0m', '✓ Generating router test...');
    const routerSpec = generateRouterSpec(moduleName);
    const specPath = getFilePath(
      `apps/api/src/modules/${moduleName}/trpc/${camelName}.router.spec.ts`,
    );
    createFile(specPath, routerSpec);

    // Step 7: Generate Frontend List Page (with smart UI)
    console.log(
      '\x1b[32m%s\x1b[0m',
      `✓ Generating frontend list page (${uiPattern.pattern} pattern)...`,
    );
    const listPage = generateFrontendListPage(moduleName, fields, relations, uiPattern);
    const listPagePath = getFilePath(
      `apps/admin/src/modules/${moduleName}/pages/${pascalName}ListPage.tsx`,
    );
    createFile(listPagePath, listPage);

    // Step 7.5: Create module index.ts
    console.log('\x1b[32m%s\x1b[0m', '✓ Creating module index.ts...');
    createModuleIndex(moduleName);

    // Step 8: Update App.tsx
    console.log('\x1b[32m%s\x1b[0m', '✓ Updating App.tsx...');
    updateAppTsx(moduleName);

    // Step 9: Update app.router.ts
    console.log('\x1b[32m%s\x1b[0m', '✓ Updating app.router.ts...');
    updateAppRouter(moduleName);

    // Step 10: Update AdminLayout (sidebar)
    console.log('\x1b[32m%s\x1b[0m', '✓ Updating AdminLayout.tsx (sidebar)...');
    updateAdminLayout(moduleName);

    // Step 11: Generate NestJS Module
    console.log('\x1b[32m%s\x1b[0m', '✓ Generating NestJS Module...');
    generateNestModule(moduleName);

    // Step 12: Register in app.module.ts
    console.log('\x1b[32m%s\x1b[0m', '✓ Registering in app.module.ts...');
    updateAppModule(moduleName);

    // Step 13: Generate Miniapp API Client
    console.log('\x1b[32m%s\x1b[0m', '✓ Generating miniapp API client...');
    const miniappClient = generateMiniappApiClient(moduleName, fields);
    const miniappApiPath = getFilePath(`apps/miniapp/src/api/${camelName}.ts`);
    createFile(miniappApiPath, miniappClient);

    // Step 14: Update Miniapp API Config
    console.log('\x1b[32m%s\x1b[0m', '✓ Updating miniapp API config...');
    updateMiniappApiConfig(moduleName);

    // Step 15: Update Miniapp API Index
    console.log('\x1b[32m%s\x1b[0m', '✓ Updating miniapp API index...');
    updateMiniappApiIndex(moduleName);

    console.log('\n\x1b[35m%s\x1b[0m', `\n✅ Module "${pascalName}" generated successfully!\n`);
    console.log('%s', '━'.repeat(50));

    // Print smart inference summary
    const inferredCount = fields.filter((f) => inferFieldConfig(f)).length;
    const relationCount = relations.length;
    console.log('\n📊 Smart Generation Summary:');
    console.log(`   Smart fields inferred: ${inferredCount}/${fields.length}`);
    console.log(`   Relations detected: ${relationCount}`);
    console.log(`   UI Pattern: ${uiPattern.pattern}`);

    console.log('\n📝 Next steps:');
    console.log(`   1. Review generated files`);
    console.log(
      `   2. Run migration: cd infra/database && npx prisma migrate dev --name add_${camelName}`,
    );
    console.log(`   3. Generate Prisma client: npx prisma generate`);
    console.log(`   4. Start servers: pnpm dev\n`);

    // Update memory registry
    updateMemoryRegistry(moduleName);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `\n❌ Generation failed: ${error}`);
    rollback();
    process.exit(1);
  }
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Full-Stack Module Generator (Phase 2 - Smart Generation)

Usage: generate-module <module-name> [options]

Options:
  --help, -h              Show this help message
  --dry-run               Preview without creating files
  --file-upload           Add file upload support

Smart Features (Phase 2):
  - Currency fields (price, amount, cost) → InputNumber with ¥ formatter + min:0 validation
  - Email fields → Input with email validation
  - Phone fields → Input with phone regex validation
  - URL fields → Input with URL validation
  - Slug fields → Input with auto-generate + regex validation
  - Image fields (avatar, cover, logo) → OSSUpload component
  - Date fields → DatePicker with showTime
  - Percent fields → InputNumber with % formatter
  - Sort fields → InputNumber with min:0
  - Relation fields (*Id) → Select/TreeSelect with auto-detection
  - UI pattern → Auto-select modal or separate pages

Examples:
  # Smart analysis (recommended)
  generate-module product

  # Preview mode with smart inference
  generate-module article --dry-run

  # With file upload support
  generate-module article --file-upload

  # Category (auto-detects parentId → TreeSelect)
  generate-module category
`);
    process.exit(0);
  }

  const moduleName = args[0];
  const dryRun = args.includes('--dry-run');
  const fileUpload = args.includes('--file-upload');

  await generateModule({
    moduleName,
    fileUpload,
    dryRun,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
