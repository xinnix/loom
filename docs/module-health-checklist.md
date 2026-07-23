# 模块健康检查清单

> 新模块应满足的最低标准。此清单在 CLAUDE.md 中有相同内容，此处为完整参考文档。
> 可通过 `/analyze` 技能自动执行此检查。

---

## API 端 · `apps/api/src/modules/{name}/`

### 必选项

- [ ] **Prisma Model** — 在 `schema.prisma` 中定义模型
- [ ] **Zod Schema** — 在 `@loom/shared` 中定义 `Create{Name}Schema` 和 `Update{Name}Schema`
- [ ] **Service** — 继承 `BaseService<T>`（`services/{name}.service.ts`）
- [ ] **tRPC Router** — 使用 `createCrudRouter` 或 `createCrudRouterWithCustom`（`trpc/{name}.router.ts`）
- [ ] **Module 注册** — 在 `*.module.ts` 声明为 NestJS 模块
- [ ] **app.router 注册** — 在 `app.router.ts` 中添加命名空间

### 按需项

- [ ] **REST Controller** — 对外暴露 REST API 时创建（Web/小程序端使用）
- [ ] **迁移文件** — `prisma migrate dev` 生成迁移记录

### 完整目录结构

```
apps/api/src/modules/{name}/
├── services/
│   ├── {name}.service.ts          # extends BaseService<ModelName>
│   └── index.ts                   # barrel export
├── trpc/
│   ├── {name}.router.ts           # createCrudRouter / createCrudRouterWithCustom
│   └── index.ts                   # barrel export
├── rest/
│   └── {name}.controller.ts       # 可选，外部 REST 端点
├── module.ts                      # @Module({ controllers: [...], providers: [...] })
└── index.ts                       # barrel export
```

---

## Admin 端 · `apps/admin/src/modules/{name}/`

### 必选项

- [ ] **StandardListPage 列表页** — `pages/{Name}ListPage.tsx`，配置 columns、formComponent
- [ ] **StandardForm 表单** — `components/{Name}Form.tsx`，声明式 FieldDefinition[]
- [ ] **StandardDetailPage 详情页** — `pages/{Name}DetailPage.tsx`，配置 DetailFieldConfig[]
- [ ] **组件 barrel 导出** — `components/index.ts` 导出所有组件和常量
- [ ] **页面 barrel 导出** — `pages/index.ts` 导出所有页面
- [ ] **模块 barrel 导出** — `index.ts` 导出页面和组件
- [ ] **App.tsx 注册** — `resources` + `Route` 注册
- [ ] **AdminLayout.md 菜单** — `menuConfig` 中添加菜单项

### 禁止事项

- ❌ 禁止手写 `useTable` + `Table` + `Modal` + `Form` 的 CRUD 重复模式
- ❌ 禁止在 `pages/` 目录写大量业务逻辑（页面保持薄层）
- ❌ 禁止重复的状态/标签颜色映射（在 `components/NameForm.tsx` 中定义一次，通过 barrel 导出共享）

### 完整目录结构

```
apps/admin/src/modules/{name}/
├── pages/
│   ├── {Name}ListPage.tsx         # StandardListPage
│   ├── {Name}DetailPage.tsx       # StandardDetailPage
│   └── index.ts                   # barrel export
├── components/
│   ├── {Name}Form.tsx             # StandardForm + FieldDefinition[] + 常量
│   ├── {Name}Detail.tsx           # DetailFieldConfig[]
│   └── index.ts                   # barrel export
└── index.ts                       # barrel export
```

---

## 共享层 · `@loom/shared`

- [ ] `{Name}Schema` — 完整模型 Zod Schema（用于详情展示）
- [ ] `Create{Name}Schema` — 创建输入（必填字段 + 默认值）
- [ ] `Update{Name}Schema` — 更新输入（所有字段可选）
- [ ] `{Name}ListQuerySchema` — 列表查询参数（可选）
- [ ] 所有 Schema 导出 `z.infer` 类型

---

## 质量清单

- [ ] **tRPC Router spec** — `{name}.router.spec.ts` 测试文件存在
- [ ] **权限配置** — 在 `Permission` 注册表中添加模块的操作权限
- [ ] **enum-sync** — 如果新增了 Prisma 枚举，执行了 `/enum-sync`
- [ ] **类型检查** — `tsc` 编译无错误
- [ ] **构建验证** — API 和 Admin 均可构建成功

---

## 豁免规则

遇到以下情况，可以不完全遵守清单：

1. **模块业务逻辑远超 CRUD 范围**（如 Auth、Upload、Payment）— 只要核心 CRUD 部分使用标准模式即可
2. **只读模块**（数据由外部系统创建，Admin 仅查看）— 可跳过 create/update/delete，使用 `createReadOnlyRouter`
3. **第三方集成模块**（如 Wecom 的消息/事件日志）— 后端可保留特化服务，前端列表页仍应使用 StandardListPage

> 豁免不是放弃标准化，而是对特殊场景的合理简化。在代码中注释说明豁免原因。

---

## `/analyze` 技能

运行 `/analyze` 可自动检查现有模块是否满足以上清单的要求。它会扫描文件结构、检查 import 模式、定位 Service 继承缺失等问题，并输出标准化建议报告。
