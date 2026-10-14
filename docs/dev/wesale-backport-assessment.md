# weSale ⇄ loom 双向反哺评估

> **日期**：2026-10-13 · **状态**：已立项（backlog E11–E15，2026-10-14；勘误见文末注记）
> **范围**：weSale（`/Users/xinnix/code/weSale`，fork 基点 2026-05-25 `9301091`）分叉后 ~5 个月的框架级改造，反向评估 loom 侧可输出项。
> **结论用途**：本文是立项输入材料——每个条目可直接作为 backlog epic 的背景节；实施另行立项，本文不改代码。

---

## 一、背景与评估方法

weSale 从 loom 分叉后演化为企微私域销售系统，期间沉淀了一批框架级改造。本评估回答双向问题：

- **正向（weSale → loom）**：哪些改造属于基础改造，值得反哺回脚手架
- **反向（loom → weSale）**：loom 演进出的哪些能力是 weSale 缺失的，值得回输

四条评估标准：

1. **正交性**：不与 loom ADR-005（YML 三层 + pi 底座）/ ADR-006（用户端会话）的架构决策冲突
2. **通用性**：脚手架任何派生项目都需要的基座能力，非 weSale 业务语义
3. **生产验证**：weSale 已落地并有验收记录（vitest 516 绿、真实调用 E2E、看板浏览器 E2E）
4. **缺口填补度**：对 loom ROADMAP / ai-native-roadmap 已规划项、CLAUDE.md Known Issues 的填补程度

**基座状态**（两侧对比结论）：`common/base.service.ts` 逐字节相同、core guards/filters/interceptors 零改造、commitlint/prettier/husky 相同——骨架稳定，cherry-pick 成本低。loom 侧后来的增强（Permission Registry、`trpc.helper` 的 permissionProcedure 集成、AI YML 契约、migration-check CI）weSale 均未跟进；weSale 侧的 AI 内核与配置中心 loom 均未有。

---

## 二、正向评估（weSale → loom）

### 2.1 第一梯队：建议回哺（5 项）

#### #1 LLM 用量埋点管线 + Admin「AI 用量」看板 ⭐ 价值最高

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **weSale 实现**     | `LlmCallLog` 表（traceId/day 日桶/sceneKey/callType/status/token/延迟/成本字段）+ `LlmTraceService`（`apps/api/src/modules/llm-trace/llm-trace.service.ts`：双缓冲 500ms/50 条批量 `createMany`、背压丢弃、`@Cron` 30 天 retention、成功采样/错误恒记）+ `llm-usage-agg.ts` 纯函数透视（总览/趋势/场景/模型四维 + 单价成本归因，chars÷1.6 估算兜底）+ `llmUsage` router + Admin 看板页 + 单价挂 `LlmConfig`（`inputPricePer1M/outputPricePer1M`）                                                                    |
| **loom 落点与适配** | loom 只有 run 级 `AgentRun.usage`（`LlmUsageAggregate` JSON），且 loop 节点绕过 `LlmService` 直连 pi（`agent-runtime.service.ts` 的 `buildPiModel` + `streamSimple`）——埋点需双路径覆盖：`chatWith/chatStreamWith` + loop 节点 streamSimple 回调；`runId` 作 traceId 关联 AgentRun。**前置缺口（2026-10-14 核验）**：loom `LlmConfig` 无单价字段，需先做 schema 迁移（`inputPricePer1M/outputPricePer1M`）+ Admin 表单扩展。设计文档 `weSale/docs/dev/llm-observability-plan.md`（含设计不变式与实施记录）可整篇迁移 |
| **回哺理由**        | 提前落地 ai-native-roadmap 第 5 步「成本报表」；weSale 已论证与 AgentRun「正交不重叠」（AgentRun 记触发器一次执行，LlmCallLog 记一次 LLM 请求）；「埋点零行为改变」铁律（golden 断言）随代码迁移                                                                                                                                                                                                                                                                                                                     |
| **工作量**          | 约 4–5.5 人日（weSale 实测：P0 采集 1.5–2 天 + 聚合 0.5–1 天 + 看板 1–1.5 天）；loom 调用面更窄（仅 agent runtime），可下调                                                                                                                                                                                                                                                                                                                                                                                          |

#### #2 Settings 平台参数中心

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **weSale 实现**     | `SettingsService`（DB→env→derived 三层兜底）+ `settings-catalog.ts`（784 行字段目录 SSOT：脱敏/灰度 optional/枚举下拉元数据）+ main.ts 启动兜底 reload。**附带架构铁律：禁止 re-declare 全局 `ConfigService` token**——Nest 同 token 双全局注册在「构造注入按注册序先命中」与「app.get 后注册者覆盖」两种解析语义下必有一侧命中错误实例（weSale 生产事故根治记录：`weSale/docs/dev/settings-config-injection-refactor.md`） |
| **loom 落点与适配** | loom 无 settings 模块（各模块独立 DB 实体 + env）。回哺**机制骨架**（service + catalog 模式 + 铁律入 CLAUDE.md），字段目录最小化——仅接管 loom 已存在的 env 业务键（如 LLM 兜底模型），不做投机性扩展                                                                                                                                                                                                                       |
| **回哺理由**        | 派生项目通用刚需（平台参数/feature flag/灰度开关）；weSale 的 DB→env→derived 链与 loom `LlmConfigService.resolveDefault`（DB isDefault → env）同构，机制有先例；生产事故换来的教训必须随机制一起回传                                                                                                                                                                                                                       |
| **工作量**          | 机制约 1–1.5 人日（weSale 实测 1.5 天含 19 模块迁移；loom 键少，迁移面小）                                                                                                                                                                                                                                                                                                                                                 |

#### #3 AgentTrigger 定时触发（已拍板形态：泛化 cron → run agent）

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **weSale 实现**     | `@Cron` 整点扫表 → **CAS 原子抢占**（`updateMany` where nextRunAt 水位 compare-and-swap）→ 建 `AgentRun` 审计行 → 执行 → SUCCEEDED/FAILED 终态回写；schedule 白名单（HOURLY/DAILY_04/09/21）+ 灰度门控键 + 幂等唯一键 + 纯执行器与调度分离（`agent-trigger-dispatcher.service.ts` / `agent-trigger-runner.service.ts` / `compute-next-run.ts`）                                                                                    |
| **loom 落点与适配** | **泛化改造**（已拍板）：动作 = 触发指定 agent 的 YML workflow（`run(slug)`），直接填补 loom YML `triggers.cron`「校验通过但运行时**静默忽略**（全仓无 warn 代码，2026-10-14 核验）」的预留边界（`infra/shared/src/ai/yml-schemas.ts` TriggersSchema）；`AgentTriggerActionSchema` 换成 agentSlug 引用；落 `@nestjs/schedule` + AgentTrigger 表 + AgentRun 审计复用。不照搬 weSale 的业务 action 白名单（GENERATE_TASK 等为其专属） |
| **回哺理由**        | ADR-005「MVP 边界」明确项 + 「后续考虑」首条（cron/队列触发，bull 依赖已备）；weSale 的 CAS 抢占（多实例幂等）/schedule 白名单/灰度门控模式直接复用                                                                                                                                                                                                                                                                                |
| **工作量**          | 约 2–3 人日（泛化适配 + YML 联动 + 管理端配置页）                                                                                                                                                                                                                                                                                                                                                                                  |

#### #4 Admin StandardListPage 两项增量 + PermissionGuard 直通

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **weSale 实现**     | `autoOpenEditParam`（URL `?key=value` 命中行自动打开编辑 Modal——深链直达调优，AI 用量看板→AgentProfile 编辑页的首个消费场景）+ `showDefaultRowActions`（`renderRowActions` 插槽与内置编辑/删除共存，解决「全有全无」刚性）+ PermissionGuard `super_admin` 角色直通                                                                                                                                                        |
| **loom 落点与适配** | 直接移植三个小特性到 `apps/admin/src/shared/components/`。注意保留 loom 的 `permission?: PermissionKey` 类型安全形态（**优于** weSale 的 `string` 松类型）；super_admin 直通与类型安全不冲突，叠加即可。**勘误（2026-10-14 核验）**：super_admin 直通 loom 后端三处已有——REST `permissions.guard.ts:26`、tRPC `permissionProcedure`（`trpc.ts:210`）、AdminLayout 菜单过滤——仅缺前端 `PermissionGuard` 组件，服务端零改动 |
| **回哺理由**        | 深链是通用交互能力；super_admin 免逐权限 seed；loom Known Issues 中「StandardListPage duplicated mutation callback patterns」另见 `mutationCallbacks.ts`（两边已有，非本项范围）                                                                                                                                                                                                                                          |
| **工作量**          | 约 0.5–1 人日（含组件用例补充）                                                                                                                                                                                                                                                                                                                                                                                           |

#### #5 文档方法论 + 约定层

|                     |                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **weSale 实现**     | `docs/doc-framework.md`（自标「可直接复制到其他项目」：文档分层/SSOT 单向引用/变更触发矩阵/健康度自检/反模式清单）+ 散装约定：@Cron 单一 Module 声明铁律、file-url 图片 URL 约定（DB 存相对路径 + Prisma 扩展剥离域名 + TransformInterceptor 出口拼装 SERVER_URL，白名单驱动）+ backlog「拍板 + 触发条件」决策记录格式 |
| **loom 落点与适配** | doc-framework 并入 loom docs 体系（或作为 `docs/README.md` 增补）；@Cron 铁律随 #3 进 api CLAUDE.md；file-url 若立项，随 #2 批次先评估 loom upload/file-storage 现状；「拍板 + 触发条件」格式吸收进 backlog 惯例（与 ADR 互补：方向性决策入 ADR，演进拍板留 backlog）                                                  |
| **回哺理由**        | 纯文档零风险；文档治理方法论被生产项目验证过一轮                                                                                                                                                                                                                                                                       |
| **工作量**          | 约 0.5 人日                                                                                                                                                                                                                                                                                                            |

### 2.2 第二梯队：只回哺经验，不搬代码（2 项）

| #   | 项                                                                                                                                                                               | 处理方式                                                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #6  | **LLM provider 兼容护栏**：`include_usage` 400 去参重试、`reasoning_content` 多轮回填（thinking 模型 400）、thinking 参数归一（`llm-thinking.ts`）、`classifyError` 错误分类     | loom 走 pi 底座，部分坑 pi 可能已处理。立项第一步：对 loom pi 流水线做覆盖度验证（DeepSeek/Qwen thinking 模型实测多轮工具循环），缺什么补什么到 `ai/llm/pi-model.factory.ts` / `LlmService` 层。weSale 侧这些坑均为真实生产踩坑（400 报错），验证成本低 |
| #7  | **ConversationEngine 通道无关模式**：引擎纯判定零 I/O + 通道适配器 DI 工厂装配 + `ConversationAgent/Kernel/Compliance` 三元组接口（`weSale/apps/api/src/modules/conversation/`） | loom 当前仅 web 单通道、ADR-006 会话已闭环；weSale 自己拍板「KfPipelineInterpreter 不泛化」。仅记为未来多通道（小程序/企微接入）时的架构参考，不实现                                                                                                    |

### 2.3 明确不回哺（含理由）

| 项                                                                                                                                                                       | 理由                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LlmClientService`（700 行五通道门面）/ `runToolLoop` 统一工具循环 / `ToolRegistryService` 整体搬运                                                                      | 与 ADR-005 冲突：loom 已选 pi 底座 + YML 工具声明 + 回环 REST 执行（D1/D4）；weSale 是代码注册 + 进程内执行的另一范式。两边各自拍板过「pi 延期 / 注册表不合一」（weSale backlog 架构归一节），不翻案                                |
| AgentProfile 场景配置中心 + AgentResolver 覆盖链                                                                                                                         | 与「YML 为编排真理源」（ADR-005 D1/D3）张力：weSale 是 DB 场景权威（12 键），loom 是 YML 节点级权威；loom 的「场景 = agent/节点」已有配置解析链（node.llm > Agent.llmConfigId > isDefault > env）。仅「单价挂 LlmConfig」随 #1 回哺 |
| 编排双源约定（seed upsert 出厂默认 / DB 运营权威）                                                                                                                       | loom 的 `AgentYamlLoader` **已是**此模式（YML 权威展示字段，DB 权威 isActive/sort/llmConfigId），无需回哺                                                                                                                           |
| enum-sync 双产物 / seed-data SQL 方案 / commitlint+husky                                                                                                                 | loom 已有对等能力（enum-sync skill、/seed-data skill + seed-base.sql、逐字节相同的 commitlint 配置）                                                                                                                                |
| knowledge/embedding RAG                                                                                                                                                  | ai-native-roadmap 第 5 步独立立项评估项；weSale 实现与其业务（知识库/画像）耦合                                                                                                                                                     |
| 业务模块全家桶（wechat-kf/mall/sidebar/moment/customer-profile/external-order/coupon/points 等 13 个）、apps/sidebar 应用、order-no 订单号、LogoMark、seed-mock 具体数据 | 业务语义，非框架                                                                                                                                                                                                                    |
| CI / lint / format 工程化                                                                                                                                                | **方向反转**：loom CI 反超 weSale（migration-check/security-audit/parse-config/web 镜像）；lint+format:check 两边 fork 即有。见反向评估                                                                                             |

---

## 三、反向评估（loom → weSale）

两仓库近乎**互补演化**：正向集中在「运行时 AI 运维 + 配置中心」，反向集中在「质量地基 + 安全加固」。骨架文件路径一致（`base.service.ts` 等逐字节相同），cherry-pick 成本低。

| #   | 项                                                           | loom 侧实现                                                                                                                                                                      | weSale 现状                                                                                                                                                                  | 价值与迁移注意                                                                                                                                                                                     |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **apiKey AES-256-GCM 加密**                                  | `ai/llm/llm-crypto.service.ts`：`apiKeyEnc = "v1:"+base64(iv\|authTag\|ciphertext)` + `apiKeyMask` 掩码展示，密钥 env `AI_ENCRYPTION_KEY`（32B），明文仅在 provider 请求瞬间存在 | **LlmConfig.apiKey 明文存 DB**（`schema.prisma` 实证：`apiKey String @map("api_key")` 无加密）；WecomConfig.secret 同样明文                                                  | **高（安全），建议最优先**。迁移需附明文→密文数据迁移步骤（一次性脚本：读明文→encrypt→回写）+ `AI_ENCRYPTION_KEY` 进生产 env；可顺带覆盖 WecomConfig.secret（loom ADR-005 自己也留了同样的后续项） |
| R2  | **E1 E2E 测试体系**                                          | `apps/e2e/`（Playwright：Admin CRUD / Web 登录→Todo 主路径）+ API 集成测试跑真实 PostgreSQL                                                                                      | 516 个 vitest 单测，**零 E2E**。正好命中 loom 路线图教训（2026-10-13）：「AI 交付当晚测试全绿，次日实测连踩 4 个缺陷，全部落在单测盲区（真实进程/真实浏览器/真实编译产物）」 | **高（质量地基）**。weSale 的 AI 链路（KF 接待降级链/商城助手/触发器）比 loom 复杂得多，单测盲区风险更大；loom 路线图称 E1 为「线 1 质量闭环地基」                                                 |
| R3  | **migration-check CI job**                                   | schema.prisma 改动必须有配套迁移文件（git 层防呆）                                                                                                                               | 已删 migrate job（迁移走容器入口），但迁移防呆与部署方式正交，当前裸奔                                                                                                       | 中；纯 CI 增量零适配                                                                                                                                                                               |
| R4  | **trpc.helper 升级：CrudService 委托 + permissionProcedure** | `createCrudRouter` 第 4 参注入 service 走 BaseService 生命周期钩子；`permissionRead/Create/Update/Delete` 声明式权限覆盖项                                                       | trpc.helper 仍是 fork 点版本（直接打 ctx.prisma，无钩子、无权限集成）                                                                                                        | 中；升级涉及 weSale 全部 ~30 个 router 兼容性回归，工作量需先行评估，建议新 router 先用新签名、存量渐进迁移                                                                                        |
| R5  | **Permission Registry 类型安全**                             | `infra/shared/src/permissions/`（`Permission` 常量 + `PermissionKey` 类型 + registry + seed SQL 自动生成）                                                                       | 旧式内联 PERMISSIONS 大对象（~175 行）；PermissionGuard 的 `permission?: string` 松类型                                                                                      | 中；与 R4 配套。（勘误 2026-10-14：super_admin 直通 loom 后端已有、仅前端组件缺失，见正向 #4 勘误）                                                                                                |
| R6  | **小项（选配）**                                             | sync-agents.sh 技能多端分发、docs/adr/ ADR 机制与模板、StandardListPage `__tests__`（118 组件用例）                                                                              | weSale 无分发脚本 / 无 adr 目录（用 backlog 拍板格式）/ 改名时丢了列表页测试                                                                                                 | 低-中；ADR 机制与 backlog 拍板格式互补而非替代，按需引入                                                                                                                                           |

**明确不推**：

- **pi 底座**：weSale 已显式延期并挂触发条件（群聊销售需要 beforeToolCall 权限闸门时重评），尊重其拍板
- **AI YML 三层**：weSale 是代码式范式，其 ConversationEngine/ToolRegistry/AgentProfile 已有等价概念；引入 YML 编排等于翻其架构归一拍板
- **apps/web**：weSale 用户面走 miniapp（商城助手聊天页已有），web 端无消费场景
- **toggle-app / .scaffold-config.json**：weSale app 集固定，多 app 开关机制无收益

---

## 四、立项建议

**正向（loom 侧立项，走 backlog epic + ADR）**：

1. **#1 LLM 可观测**先行——价值最高、有完整设计文档可迁移、与 M4 线 2 直接相关（第 5 步「成本报表」提前落地），需 ADR（记「与 AgentRun 正交」边界）
2. **#2 Settings** 次之——机制骨架 + 铁律文档化（铁律本身值得一条 dev 文档），需 ADR（配置注入架构决策）
3. **#3 AgentTrigger** 需 ADR（打开 ADR-005 MVP 边界「cron 触发」，形态：泛化 cron→run agent）
4. **#4 + #5** 合并小批次（组件小特性 + 文档，无 ADR 必要）

**反向（weSale 侧立项，走其 backlog）**：

1. **R1 apiKey 加密**最优先（安全债，含数据迁移）
2. **R2 E2E 体系**次之（质量地基，loom 可直接输出 apps/e2e 骨架 + API 集成测试模式）
3. R3 随手做（纯 CI）；R4/R5 捆绑评估（回归面先行）

**双向共同项**：#4 的 super_admin 直通若 loom 采纳，weSale 无需动作；weSale 的「拍板 + 触发条件」格式与 loom ADR 机制在两侧各自的决策记录中互补使用。

---

## 附：本评估的事实基线

- 探索时间：2026-10-13；weSale @ `4cf5eb5`，loom @ `b539ac6`
- 三路并行探索：weSale 基础设施层深挖、loom 基线盘点、骨架 diff（8 板块逐文件比对）
- 关键验证过的实证：`base.service.ts` 逐字节相同；weSale `LlmConfig.apiKey` 明文（schema）；weSale 无 apps/e2e；loom 无 settings 模块、Admin 无用量看板、`LlmService` 无场景概念；mutationCallbacks.ts / decimal.ts / statistics / specialActions 两边都有（非回哺项）
- weSale 关键设计文档（可随立项迁移）：`docs/dev/llm-observability-plan.md`、`docs/dev/settings-config-injection-refactor.md`；架构归一拍板记录：`apps/api/CLAUDE.md` + `docs/product/backlog.md`
- 2026-10-14 注记：立项时 weSale HEAD 已前进至 `448441e`；本表勘误三处（cron 实为静默忽略、super_admin 直通后端已有仅缺前端组件、#1 需 LlmConfig 单价字段前置迁移），均已回写对应条目
