# ADR-002: Admin 前端选择 Refine + Ant Design

- **日期**：2026-07-20
- **状态**：✅ 已采纳

## 背景

Loom 的管理后台需要一套企业级前端框架，核心需求：

- 开箱即用的 CRUD 列表/表单/详情页模式
- 声明式数据获取和状态管理
- 响应式布局
- 权限控制集成
- 中文国际化
- 组件丰富度

## 选项

| 方案                    | 优势                                                           | 劣势                                |
| ----------------------- | -------------------------------------------------------------- | ----------------------------------- |
| **Refine + Ant Design** | CRUD 数据流内置，`useTable`/`useForm` 等 Hook，tRPC 适配器支持 | Ant Design 包体较大，样式定制有限   |
| **React Admin + MUI**   | CRUD 成熟度高，数据提供器丰富                                  | tRPC 集成需自写适配器，主题定制复杂 |
| **Tailwind + 自建**     | 0 依赖，极致灵活，包体最小                                     | 所有 CRUD 模式需要自建，开发周期长  |

## 决策

选择 **Refine v4 + Ant Design v5**，理由：

1. **CRUD 模式匹配**：Refine 的 `useTable`/`useCreate`/`useUpdate`/`useDelete` 直接映射到后端 CRUD 操作
2. **数据提供器兼容**：Refine 的数据提供器接口与 `createCrudRouter` 的输出格式天然匹配（`{ items, total, page, pageSize }`）
3. **Ant Design 组件覆盖**：Table/Form/Select/DatePicker/Upload 等开箱即用
4. **社区活跃**：GitHub 18k+ stars，定期发布

## 权衡

### 优点

- 开发效率：列表+表单+详情页可以配置驱动，减少 50%+ 手写代码
- CRUD 一致性：所有模块遵循同一数据获取和错误处理模式
- 菜单/权限集成：Refine 的 `<Refine>` 组件统一管理资源注册和权限控制

### 缺点

- 包体负担：Ant Design 打包约 200KB+ gzipped
- 升级风险：Refine v4 → v5/6 有 breaking changes
- Ant Design 默认样式较重，二次定制需要 CSS-in-JS 覆盖
- `useTable` 等 Hook 的约定限制了某些灵活的自定义渲染

## 实施要点

- 使用 Refine 的 `dataProvider` 封装 tRPC Client，统一处理错误和 Token 刷新
- Ant Design `ConfigProvider` 全局配置 `zhCN` 中文语言包
- 模块页面在 `App.tsx` 的 `resources` 数组中注册
- 菜单在 `AdminLayout.tsx` 的 `menuItems` 中配置
- 标准模式无法满足时，使用 `render*` 插槽（`renderRowActions`/`renderHeader`/`renderModalContent`）扩展

## 替代方案保留

- 如果未来需要显著减少包体，可考虑迁移至 `refine + antd-mini` 或自建轻量 UI 层
- 目前 Admin 端全部为内部运营人员使用，包体非关键瓶颈
