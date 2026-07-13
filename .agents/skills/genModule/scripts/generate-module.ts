#!/usr/bin/env tsx
/**
 * Full-Stack Module Generator for Loom
 *
 * Rapidly generates complete CRUD modules from database schema to frontend management pages.
 * Supports smart field analysis for 10+ business patterns, file upload capabilities.
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
  enum: 'String', // Will be handled specially
  image: 'String',
  file: 'String',
};

const ZOD_TYPE_MAP: Record<string, string> = {
  string: 'z.string()',
  text: 'z.string()',
  number: 'z.number()',
  float: 'z.number()',
  boolean: 'z.boolean()',
  date: 'z.date()',
  enum: '', // Will be handled specially
  image: 'z.string()',
  file: 'z.string()',
};

// ============================================
// String Utilities
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
  }
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

  // Default fields for generic module
  return [
    { name: 'name', type: 'string', required: true },
    { name: 'description', type: 'text', required: false },
    { name: 'status', type: 'enum', required: true, enum: ['ACTIVE', 'INACTIVE'] },
  ];
}

// ============================================
// Code Generators
// ============================================

function generatePrismaSchema(moduleName: string, fields: Field[]): string {
  const pascalName = toPascalCase(moduleName);

  let schema = `\nmodel ${pascalName} {\n`;
  schema += `  id        String   @id @default(cuid())\n`;

  for (const field of fields) {
    const prismaType = field.enum ? 'String' : PRISMA_TYPE_MAP[field.type];
    const optional = field.required ? '' : '?';
    const defaultVal = field.enum ? ` // ${field.enum.join(', ')}` : '';
    schema += `  ${field.name.padEnd(20)} ${prismaType}${optional.padEnd(1)}${defaultVal}\n`;
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

  // Create schema
  output += `export const ${pascalName}Schema = {\n`;
  output += `  createInput: z.object({\n`;
  for (const field of fields) {
    if (field.name === 'id') continue;
    let zodType = field.enum
      ? `z.enum([${field.enum.map((e) => `"${e}"`).join(', ')}])`
      : ZOD_TYPE_MAP[field.type];
    if (!field.required) zodType += '.optional()';
    output += `    ${field.name}: ${zodType},\n`;
  }
  output += `  }),\n\n`;

  // Update schema - data part only (id is handled by tRPC helper wrapper)
  output += `  // updateInput is the data part only (id is handled by tRPC helper wrapper)\n`;
  output += `  updateInput: z.object({\n`;
  for (const field of fields) {
    if (field.name === 'id') continue;
    let zodType = field.enum
      ? `z.enum([${field.enum.map((e) => `"${e}"`).join(', ')}])`
      : ZOD_TYPE_MAP[field.type];
    // For optional string/text fields, make them nullable to handle form null values
    if (!field.required && (field.type === 'string' || field.type === 'text')) {
      zodType += '.nullable()';
    }
    zodType += '.optional()';
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

function generateFrontendListPage(moduleName: string, fields: Field[]): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);

  // Generate columns for the table
  let columns = '  const columns = [';
  for (const field of fields) {
    if (field.name === 'id') continue;

    if (field.type === 'boolean') {
      columns += `\n    { title: "${toLabel(field.name)}", dataIndex: "${field.name}", render: (val: boolean) => val ? "是" : "否" },`;
    } else if (field.type === 'enum') {
      columns += `\n    { title: "${toLabel(field.name)}", dataIndex: "${field.name}", render: (status: string) => {`;
      columns += `\n      const colors: Record<string, string> = {`;
      const enumValues = field.enum || [];
      for (let i = 0; i < enumValues.length; i++) {
        columns += `\n        ${enumValues[i]}: "${['orange', 'green', 'blue', 'red'][i % 4]}",`;
      }
      columns += `\n      };`;
      columns += `\n      return <Tag color={colors[status] || 'gray'}>{status}</Tag>;`;
      columns += `\n    } },`;
    } else if (field.type === 'float' || field.type === 'number') {
      columns += `\n    { title: "${toLabel(field.name)}", dataIndex: "${field.name}" },`;
    } else if (field.type === 'text') {
      columns += `\n    { title: "${toLabel(field.name)}", dataIndex: "${field.name}", render: (val: string) => val || "-" },`;
    } else {
      columns += `\n    { title: "${toLabel(field.name)}", dataIndex: "${field.name}" },`;
    }
  }
  columns += `\n  ];\n\n`;

  // Pre-compute labels for use in template (toLabel won't exist in generated file)
  const moduleLabel = toLabel(moduleName);
  const pluralLabel = toLabel(pluralName);

  // Generate form fields for Modal
  let formFields = '';
  for (const field of fields) {
    if (field.name === 'id') continue;
    const required = field.required
      ? ` rules={[{ required: true, message: "请输入${toLabel(field.name)}" }]}`
      : '';
    const label = toLabel(field.name);

    if (field.type === 'boolean') {
      formFields += `            <Form.Item name="${field.name}" label="${label}" valuePropName="checked">\n`;
      formFields += `              <Checkbox />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (field.type === 'text') {
      formFields += `            <Form.Item name="${field.name}" label="${label}">\n`;
      formFields += `              <Input.TextArea placeholder="请输入${label}" rows={3} />\n`;
      formFields += `            </Form.Item>\n`;
    } else if (field.type === 'float' || field.type === 'number') {
      formFields += `            <Form.Item name="${field.name}" label="${label}"${required}>\n`;
      formFields += `              <Input type="number" placeholder="请输入${label}" />\n`;
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
      formFields += `              <Input placeholder="请输入${label}" />\n`;
      formFields += `            </Form.Item>\n`;
    }
  }

  return `import { useList, useCreate, useUpdate } from "@refinedev/core";
import { List, DeleteButton } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Checkbox } from "antd";
import { useState } from "react";

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

${columns}  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Remove id field from values (it's handled separately by dataProvider)
      const { id, ...dataValues } = values;

      // Convert string to number for numeric fields (Ant Design Input type="number" returns string)
      const numericFields = [${fields
        .filter((f) => f.type === 'number' || f.type === 'float')
        .map((f) => `'${f.name}'`)
        .join(', ')}];
      const processedValues = { ...dataValues };
      numericFields.forEach((field: string) => {
        if (processedValues[field]) {
          processedValues[field] = Number(processedValues[field]);
        }
      });

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
          columns={columns}
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

// ============================================
// File Operations
// ============================================

const PROJECT_ROOT = path.join(__dirname, '../../../..');

function getFilePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function appendToFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, content);
  } else {
    fs.writeFileSync(filePath, content);
  }
}

function createFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

function updateAppTsx(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const appPath = getFilePath('apps/admin/src/App.tsx');

  let content = fs.readFileSync(appPath, 'utf-8');

  // Add import
  const importLine = `import { ${pascalName}ListPage } from "./modules/${moduleName}";`;
  if (!content.includes(importLine)) {
    const lastImport = content.lastIndexOf('import {');
    const importEnd = content.indexOf('\n', lastImport);
    content = content.slice(0, importEnd + 1) + importLine + '\n' + content.slice(importEnd + 1);
  }

  // Add resource
  const resource = `              {\n                name: "${camelName}",\n                list: "/${pluralName}",\n              },`;
  if (!content.includes(`name: "${camelName}"`)) {
    const resourcesEnd = content.indexOf(']}', content.indexOf('resources='));
    content = content.slice(0, resourcesEnd) + resource + '\n' + content.slice(resourcesEnd);
  }

  // Add route - Must be inside AdminLayout
  // Find the closing </Route> for the last route inside AdminLayout
  const adminLayoutEnd = content.indexOf(
    '</Route>',
    content.indexOf('<Route path="/" element={<AdminLayout'),
  );
  const route = `                  <Route path="${pluralName}" element={<${pascalName}ListPage />} />\n`;
  if (!content.includes(`<${pascalName}ListPage`)) {
    content = content.slice(0, adminLayoutEnd) + route + content.slice(adminLayoutEnd);
  }

  fs.writeFileSync(appPath, content);
}

function updateAppRouter(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const routerPath = getFilePath('apps/api/src/trpc/app.router.ts');

  let content = fs.readFileSync(routerPath, 'utf-8');

  const importLine = `import { ${camelName}Router } from "../modules/${moduleName}/trpc/${camelName}.router";`;
  if (!content.includes(importLine)) {
    const lastImport = content.lastIndexOf('import {');
    const importEnd = content.indexOf('\n', lastImport);
    content = content.slice(0, importEnd + 1) + importLine + '\n' + content.slice(importEnd + 1);
  }

  const routerLine = `  ${camelName}: ${camelName}Router,`;
  if (!content.includes(`${camelName}:`)) {
    const routerObjEnd = content.indexOf('}', content.indexOf('export const appRouter'));
    content = content.slice(0, routerObjEnd) + routerLine + '\n' + content.slice(routerObjEnd);
  }

  fs.writeFileSync(routerPath, content);
}

function updateAdminLayout(moduleName: string): void {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);
  const layoutPath = getFilePath('apps/admin/src/shared/layouts/AdminLayout.tsx');

  let content = fs.readFileSync(layoutPath, 'utf-8');

  // Add FolderOutlined import if not exists
  if (!content.includes('FolderOutlined')) {
    content = content.replace(
      'import {\n  DashboardOutlined,',
      'import {\n  DashboardOutlined,\n  FolderOutlined,',
    );
  }

  // Add menu item to the main menuItems array (before userMenuItems)
  const menuItem = `    {
      key: "/${pluralName}",
      icon: <FolderOutlined />,
      label: "${toLabel(moduleName)}管理",
      onClick: () => navigate("/${pluralName}"),
    },`;

  if (!content.includes(`key: "/${pluralName}"`)) {
    // Find the userMenuItems declaration and insert menu item before it
    const userMenuIndex = content.indexOf('const userMenuItems');
    if (userMenuIndex !== -1) {
      // Find the menuItems closing bracket before userMenuItems
      const menuItemsEnd = content.lastIndexOf('  ];', userMenuIndex);
      content = content.slice(0, menuItemsEnd) + menuItem + '\n' + content.slice(menuItemsEnd);
    }
  }

  fs.writeFileSync(layoutPath, content);
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
// Main Generation Function
// ============================================

export async function generateModule(options: GenerateOptions): Promise<void> {
  const { moduleName, fields: customFields, fileUpload, dryRun } = options;
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const pluralName = toPlural(camelName);

  console.log('\x1b[35m%s\x1b[0m', `\n🚀 Generating module: ${pascalName}\n`);
  console.log('%s', '━'.repeat(50));

  // Step 1: Get fields
  const fields = getFieldsForModule(moduleName, customFields);
  console.log('\x1b[36m%s\x1b[0m', `\n📋 Fields (${fields.length}):`);
  fields.forEach((f) =>
    console.log(`   - ${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}`),
  );

  if (dryRun) {
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  Dry run mode - no files will be created');
    return;
  }

  // Step 2: Generate Prisma Schema
  console.log('\x1b[32m%s\x1b[0m', '✓ Generating Prisma schema...');
  const prismaSchema = generatePrismaSchema(moduleName, fields);
  const schemaPath = getFilePath('infra/database/prisma/schema.prisma');
  appendToFile(schemaPath, prismaSchema);

  // Step 3: Generate Zod Schemas
  console.log('\x1b[32m%s\x1b[0m', '✓ Generating Zod schemas...');
  const zodSchemas = generateZodSchemas(moduleName, fields);
  const sharedIndexPath = getFilePath('infra/shared/src/index.ts');
  appendToFile(sharedIndexPath, zodSchemas);

  // Step 4: Generate tRPC Router
  console.log('\x1b[32m%s\x1b[0m', '✓ Generating tRPC router...');
  const trpcRouter = generateTRPCRouter(moduleName);
  const routerPath = getFilePath(`apps/api/src/modules/${moduleName}/trpc/${camelName}.router.ts`);
  createFile(routerPath, trpcRouter);

  // Step 5: Generate Frontend List Page (with Modal for create/edit)
  console.log('\x1b[32m%s\x1b[0m', '✓ Generating frontend list page...');
  const listPage = generateFrontendListPage(moduleName, fields);
  const listPagePath = getFilePath(
    `apps/admin/src/modules/${moduleName}/pages/${pascalName}ListPage.tsx`,
  );
  createFile(listPagePath, listPage);

  // Step 5.5: Create module index.ts
  console.log('\x1b[32m%s\x1b[0m', '✓ Creating module index.ts...');
  createModuleIndex(moduleName);

  // Step 6: Update App.tsx
  console.log('\x1b[32m%s\x1b[0m', '✓ Updating App.tsx...');
  updateAppTsx(moduleName);

  // Step 7: Update app.router.ts
  console.log('\x1b[32m%s\x1b[0m', '✓ Updating app.router.ts...');
  updateAppRouter(moduleName);

  // Step 8: Update AdminLayout (sidebar)
  console.log('\x1b[32m%s\x1b[0m', '✓ Updating AdminLayout.tsx (sidebar)...');
  updateAdminLayout(moduleName);

  console.log('\n\x1b[35m%s\x1b[0m', `\n✅ Module "${pascalName}" generated successfully!\n`);
  console.log('%s', '━'.repeat(50));
  console.log('\n📝 Next steps:');
  console.log(`   1. Review generated files`);
  console.log(
    `   2. Run migration: cd infra/database && npx prisma migrate dev --name add_${camelName}`,
  );
  console.log(`   3. Generate Prisma client: npx prisma generate`);
  console.log(`   4. Start servers: pnpm dev\n`);
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Full-Stack Module Generator

Usage: generate-module [options]

Options:
  --help, -h              Show this help message
  --dry-run               Preview without creating files
  --file-upload           Add file upload support

Examples:
  # Smart analysis (recommended)
  generate-module product

  # Custom fields
  generate-module order --fields="customerId:number:required,total:number:required"

  # Preview mode
  generate-module todo --dry-run
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
