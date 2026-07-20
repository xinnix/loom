# ADR-003: 声明式 UI 模式（StandardForm / StandardListPage / StandardDetailPage）

- **日期**：2026-07-20
- **状态**：✅ 已采纳

## 背景

在模块数量增长后，Admin 前端的手写 CRUD 页面暴露出以下问题：

- **重复代码**：每个模块的列表页都手写 `useTable` + Table + Modal + search + pagination
- **不一致**：不同开发者写出不同的错误处理、加载状态、操作按钮样式
- **维护困难**：修改一个行为（如错误提示方式）需要改所有页面

## 决策

创建三个标准组件，覆盖管理端所有 CRUD 页面场景：

| 组件                   | 职责          | 配置项                                                                            |
| ---------------------- | ------------- | --------------------------------------------------------------------------------- |
| **StandardListPage**   | 列表页框架    | columns, formComponent, searchFields, filterFields, permissions, renderRowActions |
| **StandardForm**       | 创建/编辑表单 | FieldDefinition[]（16 种字段类型）                                                |
| **StandardDetailPage** | 详情查看      | DetailFieldConfig[], tabs, statistics, actions                                    |

## 架构模式

```
FieldDefinition[]  → StandardForm → 声明式表单渲染
DetailFieldConfig[] → StandardDetailPage → 声明式详情渲染
columns + formComponent → StandardListPage → 列表 + CRUD Modal
```

### 关键设计原则

1. **配置驱动，非代码驱动**：所有渲染逻辑由配置数组决定，而非 JSX
2. **合理默认值，可覆盖插槽**：内置加载/错误/空状态处理；通过 `render*` 插槽自定义
3. **类型安全**：`FieldDefinition` 和 `DetailFieldConfig` 有完整 TypeScript 类型
4. **渐进增强**：简单场景用配置，复杂场景用插槽，不二选一

## 权衡

### 优点

- 代码量减少 50-60%（Agents 模块：318 行 → ~130 行）
- 所有页面风格和行为一致（错误处理、搜索防抖、权限控制、加载状态）
- 修改全局行为只需改一处（如 mutation 回调统一在 `createMutationCallbacks` 中）
- 新模块开发不用重复造轮子

### 缺点

- 灵活性受限：非常规 UI 不得不使用 `render*` 插槽或保持手写
- 抽象成本：学习三个组件和它们的配置项需要时间
- 边界案例：RoleDetailPage 的三标签页 + 权限管理超出组件适用范围，保持手写

## 适用范围

| 场景                     | 推荐模式                              |
| ------------------------ | ------------------------------------- |
| CRUD 列表 + 弹窗表单     | StandardListPage + StandardForm       |
| 列表 + 独立详情页        | StandardListPage + StandardDetailPage |
| 只读列表                 | StandardListPage（无 formComponent）  |
| 复杂标签页详情           | StandardDetailPage（render 插槽）     |
| **权限管理、流程引擎等** | 保持手写（超出组件范围）              |

## 后续方向

- `FieldDefinition` 持续扩展字段类型（颜色选择器、JSON 编辑器）
- `StandardDetailPage` 增加更多的内联操作支持
- 考虑将三个组件的配置接口移动到 `@loom/shared` 包，供 genModule 模板引用
