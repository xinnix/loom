---
name: prd-exec
description: 拆解 PRD 为可执行任务模块，按依赖顺序逐步执行并追踪进度。适用于用户提交产品需求文档后需要落地实现。
---

# PRD Exec — PRD 拆解与执行引擎

## Overview

将用户提供的 PRD（产品需求文档）拆解为有序的可执行任务，逐个完成并实时追踪进度。

核心流程：**PRD 输入 → 任务拆解 → 排序 → 逐步执行 → 进度追踪**

## When to Use

- 用户提供了一段 PRD 文档、需求描述、或功能规格说明
- 用户说"按这个 PRD 做"、"实现这个需求"、"帮我落地这个功能"
- 需要将大块需求分解为可操作的开发步骤

## Instructions

### Phase 1: PRD 分析与任务拆解

**收到 PRD 后，先完整阅读，然后输出任务拆解方案。**

1. **通读 PRD**：理解完整需求范围，识别所有功能点、数据模型、页面、接口。

2. **识别功能模块**：将 PRD 拆解为独立的功能模块，每个模块对应一个可独立验证的任务。拆解粒度：
   - 一个任务 = 一个可独立验证的功能单元（不是一个文件、也不是一个完整系统）
   - 每个任务应有明确的输入、输出、验收标准
   - 如果一个任务超过 30 分钟才能完成，继续拆分

3. **任务分类**：将每个任务归入以下类别之一：

   | 类别      | 说明                                         | 示例                       |
   | --------- | -------------------------------------------- | -------------------------- |
   | `schema`  | 数据模型变更（Prisma schema + migration）    | 新增 Order 模型            |
   | `shared`  | Zod 验证层、类型定义                         | OrderSchema 定义           |
   | `backend` | 后端 Service / tRPC Router / REST Controller | OrderService + orderRouter |
   | `admin`   | 管理后台页面                                 | OrderListPage              |
   | `web`     | Web 用户端页面                               | 订单详情页                 |
   | `miniapp` | 小程序页面/API                               | 订单列表页                 |
   | `infra`   | 基础设施（配置、部署、中间件）               | 新增环境变量、Docker 配置  |
   | `test`    | 测试用例                                     | 支付流程 E2E 测试          |

4. **排序任务**：按依赖关系排序，遵循以下优先级：

   ```
   schema → shared → backend → admin/web/miniapp → test
   ```

   同一层级内，被依赖的任务排前面。无依赖关系的任务可标注为"可并行"。

5. **输出任务拆解方案**，格式如下：

   ```
   📋 PRD 任务拆解（共 N 个任务）

   Phase 1 — 数据层
   ├── [1] 任务标题                              [schema]   ⏱ ~5min
   │   └── 验收：xxx
   ├── [2] 任务标题                              [shared]   ⏱ ~3min
   │   └── 验收：xxx
   │
   Phase 2 — 后端
   ├── [3] 任务标题                              [backend]  ⏱ ~10min
   │   ├── 依赖：[1], [2]
   │   └── 验收：xxx
   │
   Phase 3 — 前端
   ├── [4] 任务标题                              [admin]    ⏱ ~15min
   │   ├── 依赖：[3]
   │   └── 验收：xxx
   ├── [5] 任务标题                              [web]      ⏱ ~10min
   │   ├── 依赖：[3]
   │   └── 验收：xxx
   │
   Phase 4 — 验证
   └── [6] 端到端验证                            [test]     ⏱ ~5min
       ├── 依赖：[4], [5]
       └── 验收：xxx
   ```

6. **使用 TaskCreate 工具**：将每个任务创建为 TaskList 条目：
   - `subject`：任务标题（包含编号）
   - `description`：详细说明 + 验收标准
   - `metadata.phase`：所属 Phase
   - `metadata.category`：任务类别
   - `addBlockedBy`：设置依赖关系

7. **向用户确认**：展示任务拆解方案，等待用户确认后再开始执行。用户可能：
   - 调整任务优先级
   - 合并/拆分任务
   - 排除某些任务
   - 修改验收标准

### Phase 2: 逐步执行

**用户确认后，按顺序执行每个任务。**

对每个任务：

1. **标记开始**：`TaskUpdate(taskId, status: "in_progress")`，向用户展示当前进度。

2. **执行任务**：
   - 遵循项目编码规范（参见 CLAUDE.md）
   - 使用项目脚手架工具（`/genModule`、BaseService、createCrudRouter 等）
   - 匹配现有代码风格和命名约定
   - 每个任务只做该任务范围内的事（外科手术式变更）

3. **验证完成**：
   - 确认验收标准已满足
   - 如果涉及 schema 变更，运行 `/db-migrate`
   - 如果涉及共享类型，运行 `/sync`
   - 如果任务跨多层，运行 `/type-check` 确认无类型错误

4. **标记完成**：`TaskUpdate(taskId, status: "completed")`，向用户汇报：

   ```
   ✅ [3/6] 完成：OrderService + orderRouter
      - 创建了 OrderService（继承 BaseService）
      - 创建了 orderRouter（createCrudRouter）
      - 注册到 app.router.ts
      - 类型检查通过
   ```

5. **处理失败**：如果任务执行失败或验收未通过：
   - 保持 `in_progress` 状态
   - 向用户说明问题
   - 提出修复方案
   - 修复后重新验证

6. **继续下一个**：检查 TaskList，找到下一个无阻塞的任务继续执行。

### Phase 3: 总结

**所有任务完成后：**

1. 运行 `/type-check` 做最终类型检查
2. 展示完成摘要：

   ```
   🎉 PRD 执行完成！

   📊 统计
   ├── 总任务：6
   ├── 已完成：6
   ├── 跳过：0
   └── 失败：0

   📁 变更文件
   ├── schema.prisma（+1 model）
   ├── infra/shared/src/index.ts（+1 schema）
   ├── apps/api/src/modules/order/（新建）
   ├── apps/admin/src/modules/order/（新建）
   └── apps/web/src/app/(protected)/orders/（新建）

   🚀 下一步
   ├── 运行 /ship 提交代码
   └── 运行 /validate 全栈验证
   ```

## Task Execution Patterns

根据任务类别，使用对应的执行模式：

### Schema 任务

```
1. 修改 infra/database/prisma/schema.prisma
2. /db-migrate
3. verify: Prisma Client 已生成，迁移已应用
```

### Shared 任务

```
1. 在 infra/shared/src/index.ts 添加 Zod Schema
2. /sync
3. verify: 构建成功，类型可导入
```

### Backend 任务

优先使用脚手架工具：

- 标准 CRUD → `/genModule <name>` 或手动使用 BaseService + createCrudRouter
- 自定义业务逻辑 → 参考现有模块模式
- REST API → 添加 Controller（参考 references/rest-layer.md）

```
1. 创建 Service / Router / Controller
2. 注册到对应模块
3. verify: /type-check 通过
```

### Admin 任务

必须使用标准模板组件：

- 列表页 → `StandardListPage`
- 表单 → `StandardForm`
- 详情页 → `StandardDetailPage`

```
1. 创建模块目录和页面组件
2. 注册到 App.tsx（resource + route）
3. 添加侧边栏菜单项
4. verify: 页面可访问，CRUD 操作正常
```

### Web 任务

```
1. 在 apps/web/src/app/ 对应路由下创建页面
2. 通过 REST API 与后端通信
3. verify: 页面可访问，数据交互正常
```

### Miniapp 任务

```
1. 在 apps/miniapp/src/pages/ 创建页面
2. 通过 uni.request 调用 REST API
3. verify: 页面可访问，API 调用正常
```

## Notes

- **不要跳过用户确认**：任务拆解方案必须得到用户确认后才开始执行
- **遇到歧义就问**：PRD 中模糊的需求，先澄清再执行
- **保持任务粒度适中**：太大会难以追踪，太小会碎片化
- **利用已有工具**：优先用 `/genModule`、`/db-migrate`、`/sync` 等脚手架命令
- **每完成一个 Phase 汇报一次**：让用户随时了解进度
- **用户可随时调整**：允许用户在执行过程中插入、删除、修改任务
- **验收标准优先**：每个任务必须有明确的"完成"定义

## Troubleshooting

1. **PRD 过于模糊**：向用户列出不确定的点，逐个确认后再拆解
2. **任务依赖冲突**：重新排序，确保被依赖的任务先完成
3. **单个任务过于复杂**：继续拆分为更小的子任务
4. **验收标准不明确**：向用户确认"怎样算完成"
5. **执行中发现新需求**：新增任务到 TaskList，重新评估依赖关系
6. **脚手架工具无法满足**：降级为手动实现，参考现有模块代码
