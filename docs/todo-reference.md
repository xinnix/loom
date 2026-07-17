# Todo 参考模块 — 从零开始搭建一个完整业务功能

本文档用 Todo 模块作为示例，完整演示了如何在一个「业务功能」的全生命周期中，遵循 Loom 脚手架的标准模式进行开发。新人可以从本文档快速掌握**从 Prisma 到各前端端的完整链路**。

## 模块结构一览

```
todo/
├── 1. 数据层
│   ├── infra/database/prisma/schema.prisma   ← Model 定义
│   └── infra/shared/src/index.ts             ← Zod 验证 Schema + 类型
│
├── 2. 后端 API
│   ├── apps/api/src/modules/todo/
│   │   ├── index.ts                          ← 出口文件
│   │   ├── module.ts                         ← NestJS Module
│   │   ├── services/todo.service.ts          ← 继承 BaseService
│   │   ├── trpc/todo.router.ts               ← tRPC Router（Admin 端使用）
│   │   └── rest/todo.controller.ts           ← REST Controller（Web/小程序使用）
│   ├── apps/api/src/app.module.ts            ← 注册 Module
│   └── apps/api/src/trpc/app.router.ts       ← 注册 tRPC 路由
│
├── 3. Admin 端（React + Refine + Ant Design）
│   ├── apps/admin/src/modules/todo/
│   │   ├── index.ts                          ← 出口文件
│   │   ├── pages/
│   │   │   ├── TodoListPage.tsx              ← StandardListPage 通用列表页
│   │   │   └── TodoDetailPage.tsx            ← 详情页
│   │   └── components/
│   │       ├── TodoForm.tsx                  ← StandardForm 声明式表单
│   │       └── TodoDetail.tsx                ← 详情字段定义
│   ├── apps/admin/src/App.tsx                ← 注册 Resource + Route
│   └── apps/admin/src/shared/layouts/AdminLayout.tsx  ← 新增菜单
│
├── 4. Web 用户端（Next.js SSR + REST + Tailwind）
│   └── apps/web/src/app/(protected)/todos/
│       ├── page.tsx                          ← 列表页
│       ├── create/page.tsx                   ← 创建页
│       └── [id]/page.tsx                     ← 详情页
│
└── 5. 小程序端（uni-app + Vue 3 + REST）
    ├── apps/miniapp/src/api/todos.ts         ← API 模块
    └── apps/miniapp/src/pages/todos/
        ├── index.vue                         ← 列表页
        ├── create.vue                        ← 创建页
        └── detail.vue                        ← 详情页
```

---

## 第一步：数据层

### 1.1 Prisma Model（schema.prisma）

**参考路径：** `infra/database/prisma/schema.prisma`

添加一个新的 Prisma Model，定义所有字段、索引、表名映射和关联关系。

```prisma
model Todo {
  id          String   @id @default(cuid())
  title       String
  description String?
  // ... 其他字段

  // 关联：如果与 User 有多对一关系
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])                // 常用查询索引
  @@index([status])
  @@map("todos")                   // 数据库表名（snake_case）
}
```

**要在 User 模型上同步添加关系字段：**

```prisma
model User {
  // ... 已有字段
  todos  Todo[]   // 新增：关联的 Todo 列表
}
```

**关键原则：**
- `@@map()` 必须全部 `snake_case`
- 必须为高频查询字段添加 `@@index`
- 关联的外键字段名 = 模型名小写 + `Id`（如 `userId`、`categoryId`）

### 1.2 Zod 验证 Schema（infra/shared/src/index.ts）

**参考路径：** `infra/shared/src/index.ts`

```typescript
// 1. 常量定义（状态枚举、权限等）
export const TodoStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

// 2. 完整的模型 Schema（用于详情展示）
export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  // ...
});

// 3. 创建 Schema（必填 + 可选）
export const CreateTodoSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional().nullable(),
  priority: z.number().int().optional().default(0),
});

// 4. 更新 Schema（全部可选）
export const UpdateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  priority: z.number().int().optional(),
});

// 5. 列表查询 Schema（分页 + 搜索 + 筛选）
export const TodoListQuerySchema = z.object({
  page: z.number().int().optional().default(1),
  pageSize: z.number().int().optional().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

// 6. 类型推导
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
```

**建议：如果是新模块，拆分为 `infra/shared/src/schemas/<模块名>/index.ts`**

---

## 第二步：后端 API

### 2.1 NestJS Module（module.ts）

**参考路径：** `apps/api/src/modules/todo/module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TodoController } from './rest/todo.controller';

@Module({
  controllers: [TodoController],   // 注册 REST Controller
  imports: [],                      // 依赖的模块
  providers: [],                    // 注册 Service
  exports: [],                      // 导出 Service
})
export class TodoModule {}
```

**注册到 App Module：**

```typescript
// apps/api/src/app.module.ts
import { TodoModule } from './modules/todo/module';

@Module({
  imports: [
    // ... 其他模块
    TodoModule,                     // <-- 新增
  ],
})
```

### 2.2 Service（继承 BaseService）

**参考路径：** `apps/api/src/modules/todo/services/todo.service.ts`

所有业务 Service 必须继承 `BaseService`，它会自动提供：

| BaseService 方法 | 用途 |
|---|---|
| `list(args?)` | 分页列表（data + total + page） |
| `getOne(id)` | 按 ID 查询 |
| `getOneOrThrow(id)` | 按 ID 查询，不存在则 throw |
| `create(data)` | 创建（触发 before/after hooks） |
| `update(id, data)` | 更新 |
| `remove(id)` | 删除 |
| `removeMany(ids)` | 批量删除 |
| `count(where?)` | 计数 |
| `exists(where)` | 存在检查 |

```typescript
@Injectable()
export class TodoService extends BaseService<'Todo'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Todo');
  }

  // 自定义业务方法
  async complete(id: string) {
    return this.model.update({
      where: { id },
      data: { isCompleted: true, status: 'completed', completedAt: new Date() },
    });
  }
}
```

### 2.3 tRPC Router（Admin 端专用）

**参考路径：** `apps/api/src/modules/todo/trpc/todo.router.ts`

**方式 A：纯标准 CRUD（最简洁）**

```typescript
export const todoRouter = createCrudRouter('Todo', {
  create: CreateTodoSchema,
  update: UpdateTodoSchema,
});
```

**方式 B：标准 CRUD + 自定义方法**

```typescript
export const todoRouter = createCrudRouterWithCustom(
  'Todo',
  { create: CreateTodoSchema, update: UpdateTodoSchema },
  (t) => ({
    toggleComplete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const todo = await ctx.prisma.todo.findUnique({ where: { id: input.id } });
        return ctx.prisma.todo.update({
          where: { id: input.id },
          data: { isCompleted: !todo.isCompleted },
        });
      }),
  }),
);
```

**注册到 app.router.ts：**

```typescript
// apps/api/src/trpc/app.router.ts
import { todoRouter } from '../modules/todo/trpc/todo.router';

export const appRouter = router({
  todo: todoRouter,    // <-- 新增（resource 名称必须和 Admin 端一致）
});
```

### 2.4 REST Controller（Web/小程序端使用）

**参考路径：** `apps/api/src/modules/todo/rest/todo.controller.ts`

```typescript
@Controller('todos')
export class TodoController {
  constructor(private readonly prisma: PrismaService) {}

  // 列表（必须数据隔离：只返回当前用户的）
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: any, @Query('page') page?: string) {
    const where = { userId: user.id };        // 数据隔离
    const [items, total] = await Promise.all([
      this.prisma.todo.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.todo.count({ where }),
    ]);
    return { success: true, data: items, meta: { total, page, pageSize, totalPages } };
  }

  // 详情
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@CurrentUser() user: any, @Param('id') id: string) { ... }

  // 创建
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: any, @Body() body: any) { ... }

  // 更新
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) { ... }

  // 删除
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: any, @Param('id') id: string) { ... }
}
```

---

## 第三步：Admin 端（React + Refine + Ant Design）

### 3.1 使用 StandardListPage 的列表页

**参考路径：** `apps/admin/src/modules/todo/pages/TodoListPage.tsx`

```typescript
export function TodoListPage() {
  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (val: string) => <Tag>{val}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD') },
  ];

  return (
    <StandardListPage
      resource="todo"                       // 必须和 app.router.ts 的 key 一致
      title="Todo 示例管理"
      columns={columns}
      formComponent={TodoForm}
      searchFields={[{ field: 'search', placeholder: '搜索标题' }]}
      filterFields={[
        { field: 'status', type: 'select', placeholder: '状态',
          options: [{ value: 'pending', label: '待处理' }, ...] },
      ]}
      permissions={{
        create: PERMISSIONS.TODO.CREATE,
        update: PERMISSIONS.TODO.UPDATE,
        delete: PERMISSIONS.TODO.DELETE,
      }}
    />
  );
}
```

### 3.2 使用 StandardForm 的表单

**参考路径：** `apps/admin/src/modules/todo/components/TodoForm.tsx`

```typescript
const fields: FieldDefinition[] = [
  { key: 'title', label: '标题', type: 'input', required: true },
  { key: 'status', label: '状态', type: 'select',
    options: [{ value: 'pending', label: '待处理' }, ...] },
  { key: 'priority', label: '优先级', type: 'number', min: 0, max: 2 },
  { key: 'dueDate', label: '截止日期', type: 'date' },
];
```

### 3.3 注册 Resource + Route + 菜单

**App.tsx 三个改动：**

```typescript
// 1. 导入
import { TodoListPage, TodoDetailPage } from './modules/todo';

// 2. 注册 Resource（在 Refine 的 resources 数组中）
{ name: 'todo', list: '/todos' }

// 3. 注册 Route（在 Routes 中）
<Route path="todos" element={<TodoListPage />} />
<Route path="todos/:id" element={<TodoDetailPage />} />
```

**AdminLayout.tsx 菜单配置：**

```typescript
const menuConfig = [
  // ... 已有菜单
  {
    key: "todo",
    label: "Todo 示例",
    icon: "CheckSquareOutlined",
    permission: null,
    children: [
      { key: "/todos", label: "Todo 管理", icon: "CheckSquareOutlined", permission: null },
    ],
  },
];
```

---

## 第四步：Web 用户端（Next.js SSR + REST）

**参考路径：** `apps/web/src/app/(protected)/todos/`

Web 端通过 REST API 通信，使用 `apiClient` 工具。

```typescript
// 获取列表
const res = await apiClient.get<Todo[]>('/todos');

// 创建
const res = await apiClient.post('/todos', { title, description });

// 获取详情
const res = await apiClient.get<Todo>(`/todos/${id}`);

// 更新
const res = await apiClient.put(`/todos/${id}`, { isCompleted: true });

// 删除
const res = await apiClient.delete(`/todos/${id}`);
```

**响应格式：**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total: number; page: number; pageSize: number; totalPages: number };
}
```

---

## 第五步：小程序端（uni-app + Vue 3 + REST）

### 5.1 API 模块

**参考路径：** `apps/miniapp/src/api/todos.ts`

```typescript
import { http } from '@/utils/http';
import { API_ENDPOINTS } from '@/config/api';

export const todoApi = {
  getList: (params?: { page?: number }) =>
    http.get(API_ENDPOINTS.todos, params),
  getById: (id: string) => http.get(API_ENDPOINTS.todoDetail(id)),
  create: (data: { title: string; description?: string }) =>
    http.post(API_ENDPOINTS.todos, data),
  update: (id: string, data: any) =>
    http.put(API_ENDPOINTS.todoDetail(id), data),
  delete: (id: string) => http.delete(API_ENDPOINTS.todoDetail(id)),
};
```

### 5.2 API 端点配置

**参考路径：** `apps/miniapp/src/config/api.ts`

```typescript
export const API_ENDPOINTS = {
  // ... 已有端点
  // 新增：
  todos: '/todos',
  todoDetail: (id: string) => `/todos/${id}`,
} as const;
```

---

## 快速复用 Checklist

从 Todo 模块复制模式到新模块时，逐项检查：

### 数据层
- [ ] `schema.prisma` — 添加 Model + 索引 + `@@map` + 关联关系
- [ ] User（或其他父模型）— 添加关联字段（如 `todos Todo[]`）
- [ ] `infra/shared` — 添加 CreateSchema / UpdateSchema / Schema / ListQuerySchema / 类型
- [ ] `infra/shared` — 添加权限常量到 `PERMISSIONS`
- [ ] 运行 `prisma migrate dev` → 生成迁移文件
- [ ] 重建 `@loom/shared`

### 后端 API
- [ ] `services/xxx.service.ts` — 继承 `BaseService<'Xxx'>`
- [ ] `trpc/xxx.router.ts` — 使用 `createCrudRouter` 或 `createCrudRouterWithCustom`
- [ ] `rest/xxx.controller.ts` — 完整的 REST CRUD + 数据隔离
- [ ] `module.ts` — NestJS Module
- [ ] `app.module.ts` — 注册 Module
- [ ] `app.router.ts` — 注册 tRPC Router

### Admin 端
- [ ] 列表页 — 使用 `StandardListPage`
- [ ] 表单 — 使用 `StandardForm`（声明式 FieldDefinition[]）
- [ ] `App.tsx` — 注册 resource + route
- [ ] `AdminLayout.tsx` — 新增菜单

### Web 端
- [ ] 列表页、创建页、详情页 — 使用 `apiClient` REST 调用
- [ ] `Sidebar.tsx` — 新增导航链接

### 小程序端
- [ ] `api/xxx.ts` — API 模块
- [ ] `config/api.ts` — 端点配置
- [ ] `api/index.ts` — 导出
- [ ] 列表页、创建页、详情页

---

## Todo 模型字段的示范意义

| 字段 | 类型 | 示范目的 |
|---|---|---|
| `title` | String (required) | 基础必填字段 |
| `description` | String (optional) | 可选文本字段，支持 null |
| `status` | String (default: "pending") | 枚举状态字段 |
| `priority` | Int (default: 0) | 数字排序/筛选字段 |
| `dueDate` | DateTime (optional) | 可选日期字段 |
| `isCompleted` | Boolean (default: false) | 布尔状态字段 |
| `userId` | String (foreign key) | 用户关联（数据隔离） |
| `createdAt` | DateTime (auto) | 审计时间戳 |
| `updatedAt` | DateTime (auto) | 审计时间戳 |
| `completedAt` | DateTime (optional) | 业务时间戳（完成时间） |

---

## Todo 模块 vs genModule 自动生成的代码

| 对比维度 | Todo 参考模块（手写） | genModule 自动生成 |
|---|---|---|
| 后端 Service | 继承 BaseService（有 hook 扩展点） | 继承 BaseService |
| tRPC Router | createCrudRouterWithCustom（可扩展） | createCrudRouter（标准 CRUD） |
| REST Controller | 完整 CRUD + 数据隔离 | 完整 CRUD + 数据隔离 |
| Admin 列表页 | StandardListPage 配置驱动 | StandardListPage 配置驱动 |
| Admin 表单 | StandardForm 声明式字段 | StandardForm 声明式字段 |
| Web 页面 | REST API + Tailwind | 不生成 |
| 小程序页面 | REST API + uni-app 组件 | 不生成 |

**总结：** genModule 生成「能用的模版」，Todo 模块展示「完整的最佳实践」。
