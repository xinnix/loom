# Loom 脚手架愿景

> 新项目接手：init-project 后请将本文件重写为新项目的愿景（一句话定位、红线、术语表），本文档章节骨架可保留作模板。重置指引见 [docs/README.md](../README.md#新项目接手指南)。

---

## 一句话定位

**开箱即用的全栈管理系统脚手架**：克隆 → 初始化 → 生成模块，即可交付一个带 RBAC、双端认证、支付与上传能力的标准管理系统，全程由 AI Agent 按固定模式开发。

## 终态定义

Loom 做到终态时，一个新项目从零到首个业务模块上线应该只发生三类动作：

| 动作                 | 载体                                     | 人的参与       |
| -------------------- | ---------------------------------------- | -------------- |
| 项目初始化与身份替换 | `/init-project`、`/scaffold-clean`       | 回答交互问题   |
| 业务建模             | `schema.prisma` + Zod Schema             | 描述领域模型   |
| 模块生成与微调       | `/genModule` + 标准组件的 `render*` 插槽 | 审查与定制边界 |

凡是这三类动作覆盖不了的全栈场景，都意味着脚手架抽象层有缺口——补抽象层，而不是绕过它手写。

## 防走偏红线

红线是任何变更都不得破坏的约束。冲突时删功能，不破红线。

| #   | 红线                                                                                                              | 依据             |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---------------- |
| R1  | `schema.prisma` 是唯一模型真理源；`infra/shared` 是唯一验证真理源；所有端共享 `@loom/shared` 类型                 | SSOT 原则        |
| R2  | 生产数据库只走 `migrate deploy`，迁移文件必须入库，禁止 `db push`                                                 | Schema 变更流程  |
| R3  | 管理端页面必须使用三大标准组件（StandardListPage / StandardForm / StandardDetailPage），仅允许 `render*` 插槽扩展 | ADR-003、ADR-004 |
| R4  | 双协议边界：Admin 端走 tRPC，外部端（Web/小程序/Landing）走 REST；tRPC context 只解析 Admin 用户                  | ADR-001          |
| R5  | 数据隔离：User 用户只能访问自己的数据（`where: { userId }`），创建时自动注入当前用户 ID                           | 数据隔离原则     |
| R6  | 脚手架抽象层领域中性：BaseService / Standard* / genModule 模板中不得出现具体业务词汇，业务逻辑只存在于业务模块内  | 领域中性原则     |
| R7  | 新增依赖前先查 workspace 已有能力；引入需满足维护活跃度与许可证要求                                               | 依赖治理规则     |

## 核心概念与术语

| 概念                 | 层    | 职责                                             | 参考实现                                               |
| -------------------- | ----- | ------------------------------------------------ | ------------------------------------------------------ |
| `BaseService`        | API   | 通用 CRUD 基类，生命周期钩子承载业务逻辑         | `apps/api/src/common/base.service.ts`                  |
| `createCrudRouter`   | API   | tRPC CRUD 路由工厂（含 `WithCustom` / 只读变体） | `apps/api/src/trpc/trpc.helper.ts`                     |
| `StandardListPage`   | Admin | 声明式列表页                                     | `apps/admin/src/shared/components/StandardListPage/`   |
| `StandardForm`       | Admin | 声明式表单（FieldDefinition 驱动）               | `apps/admin/src/shared/components/StandardForm/`       |
| `StandardDetailPage` | Admin | 声明式详情页                                     | `apps/admin/src/shared/components/StandardDetailPage/` |
| `FileStorageService` | API   | 多策略文件存储（local / OSS 直传 / 服务端中转）  | `apps/api/src/shared/services/file-storage.service.ts` |
| `menuConfig`         | Admin | 参数化菜单配置                                   | `apps/admin/src/shared/layouts/AdminLayout.tsx`        |
| `genModule`          | 技能  | 全栈 CRUD 模块生成器                             | `.claude/skills/genModule/`                            |

术语约定：**模块（Module）**= 一个 Prisma Model + Service + Router + Admin 页面的完整纵切；**端（App）**= `apps/` 下的一个可部署应用；**剧本**= 面向实施者的端到端操作步骤（见 [mvp.md](mvp.md)）。

## 非目标

- **不做业务系统**：Loom 不内置任何真实业务模块（todo 仅作为模式示范），业务功能由派生项目自行开发
- **不做行业定制代码**：行业差异以配置与派生项目文档表达，不进脚手架代码（R6 的推论）
- **不追求多 UI 框架**：Admin 端绑定 Refine + Ant Design（ADR-002），不为支持其他 UI 库做抽象

## 风险与对策

| 风险                                       | 对策                                                      |
| ------------------------------------------ | --------------------------------------------------------- |
| 抽象层被绕过，模块逐渐手写退化             | R3 + `/analyze` 模块健康检查 + 模块健康检查清单           |
| 标准组件膨胀为万能组件                     | 复杂场景走 `render*` 插槽或保持手写（ADR-003 适用范围表） |
| 派生项目改动脚手架核心文件导致无法跟进升级 | init-project 只做身份替换；定制通过模块与配置承载         |
