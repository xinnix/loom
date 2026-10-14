# Backend API (NestJS + tRPC)

## 架构

- **tRPC Router** — Admin 端强类型 API，所有 CRUD 操作
- **REST Controller** — 外部/小程序 API，标准 HTTP 端点
- **Service** — 业务逻辑层，应继承 BaseService

## 关键模式

### Service 必须继承 BaseService

```typescript
export class XxxService extends BaseService<Xxx> {
  constructor(prisma: PrismaService) {
    super(prisma, 'xxx');
  }
}
```

### Router 优先使用 createCrudRouter

```typescript
export const xxxRouter = createCrudRouter({
  model: 'xxx',
  service: XxxService,
  schemas: { createInput: CreateXxxSchema, updateInput: UpdateXxxSchema },
  // 可选：searchFields, filterableFields, auth 配置
});
```

### 自定义 procedure 用 createCrudRouterWithCustom

```typescript
export const xxxRouter = createCrudRouterWithCustom(
  { /* CRUD 配置 */ },
  (t) => ({
    customAction: protectedProcedure.input(...).mutation(...),
  })
);
```

## 目录结构

```
src/
├── modules/<name>/       # 业务模块
│   ├── <name>.service.ts
│   ├── <name>.router.ts
│   └── <name>.controller.ts  # 可选，REST 端点
├── ai/                   # AI 三层架构（框架级能力，ADR-005）
│   ├── llm/              # 第 1 层：LLM 配置与调用（pi 底座，apiKey AES 加密）
│   ├── tools/            # 第 2 层：YML 声明的内部 REST 映射工具 + 代码工具扩展点
│   ├── agents/           # 第 3 层：YML 编排运行时（chat/loop 节点 + AgentRun 审计）
│   └── definitions/      # YML 真理源（agents/*.yml + tools/*.yml，git 版本控制）
├── trpc/
│   ├── app.router.ts     # 路由注册
│   └── trpc.helper.ts    # createCrudRouter 工厂
├── common/
│   └── base.service.ts   # CRUD 基类
└── shared/services/      # 共享服务（文件存储等）
```

## AI 三层（ADR-005）

- LLM 调用一律注入 `LlmService`（`src/ai/llm/`），禁止手写 fetch 调模型 API
- 新增 agent 编排/工具 = 在 `src/ai/definitions/` 加 YML（Zod 校验，dev 热加载），不写代码
- 工具只允许映射本机 `/api/` 下内部端点（执行器硬编码回环）；MVP 只接只读工具
- apiKey 明文永不落库/入日志（AES-256-GCM，密钥 `AI_ENCRYPTION_KEY`）

## 注意事项

- tRPC 路由在 `app.router.ts` 中注册（AI 三命名空间由 main.ts 经 AI_TRPC_ROUTERS 合并）
- REST Controller 需要 `@Controller()` 装饰器
- userId 注入：BaseService 自动处理 `createdById`/`updatedById`
- 数据隔离：User 端查询必须加 `where: { userId }`
- ⚠️ **带 `@Cron` 的服务必须单一 Module 声明**（当前：`LlmTraceService`、`AgentTriggerDispatcherService`）——provider 只允许在自己的 Module 里声明一次，import 该 Module 多次是安全的（Nest 按 module 类去重实例）；在多处重复声明 provider 会导致定时任务重复触发
- DB 配置读取显式注入 `SettingsService`（ADR-008）；禁止 re-declare 全局 ConfigService token（铁律详见 `docs/dev/settings-config-injection.md`）

## API 端治理规则

### 模块创建

参考根目录 CLAUDE.md 的【模块健康检查清单】API 端部分。关键要点：

- 新模块 Service **必须** 继承 `BaseService<T>`，除非有充分理由不要
- tRPC Router 优先使用 `createCrudRouter`，需要自定义时用 `createCrudRouterWithCustom`
- REST Controller 仅在有外部端（Web/小程序/第三方）需要时才创建
- 所有 Procedure 必须有 `zod` input schema 验证

### API 端依赖治理

- 新增 NestJS 模块前确认是否可以用现有 Provider 组合实现
- Prisma middleware 优于自定义数据访问层
- 避免在 Service 中直接使用 `ctx.prisma` — 通过 BaseService 方法操作数据库
- 本包依赖优先使用 Monorepo 工作区互引，避免外部 npm 依赖
