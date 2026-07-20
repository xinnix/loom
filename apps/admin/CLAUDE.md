# Admin UI (React + Refine + Ant Design)

## 架构

- **Refine** — 数据框架，提供 useTable/useCreate/useUpdate/useDelete 等 hooks
- **Ant Design** — UI 组件库
- **tRPC Client** — 强类型调用后端 API

## 关键模式

### 列表页使用 StandardListPage 模式

每个列表页遵循相同结构：useTable + modal 创建/编辑 + 搜索/筛选 + 批量操作。

### 表单使用 StandardForm 模式

声明式表单，通过 FieldDefinition[] 配置字段类型和验证规则。

## 目录结构

```
src/
├── modules/<name>/
│   ├── pages/
│   │   └── <Name>ListPage.tsx
│   ├── components/
│   │   ├── <Name>Form.tsx
│   │   └── <Name>Detail.tsx
│   └── index.ts
├── shared/
│   ├── components/       # StandardListPage, StandardForm
│   ├── layouts/          # AdminLayout（菜单配置）
│   └── constants/        # enums.ts
└── types/                # tRPC 类型定义
```

## 注意事项

- 页面在 `App.tsx` 中注册为 Refine resource + Route
- 菜单项在 `AdminLayout.tsx` 的 menuItems 中添加
- 表单提交后调用 `invalidateQueries` 刷新列表
- 日期字段需要 dayjs 转换
- 图片字段使用 Upload 组件 + FileStorageService

## Admin 端治理规则

### 页面创建

参考根目录 CLAUDE.md 的【模块健康检查清单】Admin 端部分。关键要点：

- 所有 CRUD 页面 **必须** 使用 StandardListPage / StandardForm / StandardDetailPage，禁止手写重复模式
- 仅在标准组件不满足需求时使用 `render*` 插槽（`renderRowActions`/`renderHeader`/`renderModalContent`）
- 字段定义（`FieldDefinition[]` / `DetailFieldConfig[]`）写在 `components/` 目录，`pages/` 保持薄层
- 页面注册四步走：`resources` → `Route` → 菜单 → barrel export

### Admin 端依赖治理

- UI 组件：优先使用 Ant Design 现有组件，不引入额外 UI 库
- 数据获取：优先使用 Refine `useTable`/`useOne`/`useCreate` 等 Hook，不直接调用 tRPC Client
- tRPC Client：仅在 Refine Hook 不足以表达时才直接调用（如自定义查询、权限管理）
- 本包依赖：优先使用 Monorepo 工作区互引的 `@loom/shared` 类型
