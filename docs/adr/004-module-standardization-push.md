# ADR-004: 模块标准化推广至全部业务模块

- **日期**：2026-07-21
- **状态**：✅ 已采纳

## 背景

ADR-003 建立了 `StandardListPage` / `StandardForm` / `StandardDetailPage` 三个标准组件，并以 Todo 模块作为示范完成了首轮改造。当时其余 6 个业务模块仍使用手写模式，存在以下问题：

| 模块       | 后端问题                                      | 前端问题                            |
| ---------- | --------------------------------------------- | ----------------------------------- |
| **Agents** | —（已标准化）                                 | —（已标准化）                       |
| **User**   | 手写 Router，无 BaseService                   | ✅ 前端已标准化                     |
| **Role**   | 手写 CRUD，无 BaseService                     | DetailPage 手写（292 行，3 个 Tab） |
| **Admin**  | 完全手写（618 行），AdminService 存在但未使用 | 全部手写（ListPage 500+ 行）        |
| **Wecom**  | Config 手写，Event/Message 已标准化 ✅        | 全部手写（3 个列表页 + 1 个表单）   |

总代码重复度：**约 50-60% 的 CRUD 页面代码是重复的**。

## 决策

对全部剩余模块按以下原则进行标准化改造：

### 后端标准化

1. **Service 层**：创建 `UserService`、`RoleService`、`AdminService`，继承 `BaseService<T>`
   - 业务逻辑（密码哈希、系统角色保护、slug 唯一性、超级管理员保护）迁移到 Service 生命周期钩子
   - Router 层保持 `ctx.prisma` 直接操作（NestJS DI 集成待后续）
2. **Router 层**：复杂业务模块（User/Role/Admin）保留自定义 procedures 覆盖
   - `createCrudRouterWithCustom` 作为容器，Custom procedures 包含所有业务逻辑
   - 标准 CRUD 不适用于包含复杂校验的场景（系统角色保护、自我删除保护、事务级联删除）
3. **简化模块**（Wecom Event/Message）：使用 `createReadOnlyRouter` ✅

### 前端标准化

1. **列表页**：全部改用 `StandardListPage` 配置驱动
2. **表单**：全部改用 `StandardForm` + `FieldDefinition[]`
3. **详情页**：全部改用 `StandardDetailPage` + `DetailFieldConfig[]`
4. **复杂插槽保留**：RoleDetailPage 的权限管理 Tab、AdminDetailPage 的角色管理 Tab 通过 `renderTabContent` 保留

### 标准化模式决策树

```
模块是否是纯 CRUD？
├── 是 → 使用 createCrudRouter + StandardListPage + StandardForm
├── CRUD + 少量扩展 → 使用 createCrudRouterWithCustom + StandardListPage + StandardForm
└── 复杂业务逻辑 → 保持自定义 procedures
    前端是否能使用标准组件？
    ├── 多标签页详情 → StandardDetailPage + renderTabContent
    ├── 行内自定义操作 → StandardListPage + renderRowActions
    └── 完全超出范围 → 保持手写（标注原因）
```

## 权衡

### 优点

- **代码量减少**：AdminListPage：509 → 218 行（-57%），RoleDetailPage：292 → 240 行（-18%），WecomConfigListPage：302 → ~130 行（-57%）
- **一致性提升**：所有模块的列表页/表单/详情页行为一致（错误处理、搜索防抖、空状态、权限控制）
- **可维护性**：全局修改（如 mutation 回调、权限验证逻辑）只需改标准组件一处
- **新模块开发加速**：已有 Todo/Agents/User/Role/Admin/Wecom 的标准化模式可复制

### 缺点

- **灵活性受限**：AdminForm 移除了行内的角色选择器（`roleIds`），改为依赖 AdminDetailPage 管理角色
- **抽象依赖**：DynamicSelect 只支持 `name/title/username` 展示，不支持自定义 JSX（如 Role Select 的 Tag 颜色）
- **Wecom secret 字段**：StandardForm 的 `showOnlyInCreate` 完全隐藏编辑时的 secret 字段，改变原有 UX（可留空修改）

## 实施要点

1. **执行顺序**：User → Role → Admin → Wecom（低复杂度到高复杂度）
2. **先后端后前端**：Service → Router → Admin 页面，保证 API 兼容
3. **不改 API 契约**：getMany/getOne 的返回数据格式保持不变，避免前端联动修改
4. **类型检查 + 构建验证**：每个模块改造后运行 `type-check` 和 `build`

## 后续考虑

- **NestJS DI 集成**：将 Service 实例传入 `createCrudRouter` 的 `service` 参数，使生命周期钩子生效
- **DynamicSelect 增强**：支持自定义 `optionLabel` 渲染函数
- **genModule 模板更新**：同步新的标准化模式到模块生成器
- **StandardForm 增加 `treeSelect` 字段类型**：支持 Admin/Role 的权限树选择
