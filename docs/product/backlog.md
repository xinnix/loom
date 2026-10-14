# Loom 脚手架 Backlog

> 新项目接手：init-project 后请清空本表，改为新项目的 epic 任务池（每行：做什么/为什么/来源）。重置指引见 [docs/README.md](../README.md#新项目接手指南)。

---

已确认待做的 epic 级任务池。**只写做什么/为什么，不写规格与排期**；规格进入对应 PRD 修订，排期由 [ROADMAP.md](../ROADMAP.md) 阶段体现，执行时在 `../task/active/` 建任务文档。来源标注提出出处；[archive/future-directions.md](../archive/future-directions.md) 为历史汇总，以其条目在本表的现状修正为准。

## 任务池

| Epic                  | 做什么                                                                                                                                                                                                                                                     | 为什么                                                                                                                    | 来源                                                                             | 状态          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------- |
| E1 测试体系           | Playwright E2E（Admin CRUD 路径、Web 登录→Todo 流）；API 集成测试（测试 PostgreSQL 跑真实 Prisma）；genModule 生成的 spec 增加权限/搜索/筛选用例                                                                                                           | 抽象层已有 118 组件用例，缺端到端集成验证                                                                                 | future-directions §4                                                             | todo          |
| E2 类型安全           | API 与 Admin 开启 TS strict（先修复 base.service / trpc.helper 的 `as any`）；消除 `types/api.ts` 的 `AppRouter = any`                                                                                                                                     | 核心抽象层与端到端类型目前绕过编译期检查                                                                                  | future-directions §7、CLAUDE.md Known Issues                                     | todo          |
| E3 安全加固           | ~~Agent `apiKey` 落库加密~~（✅ 2026-10-12 随 ADR-005 完成，AES-256-GCM）；Wecom `secret` 落库加密；Dockerfile 非 root 用户；限流状态外置（当前内存 Map 多实例失效）；Web 端 CSRF 防护                                                                     | 密钥明文是现存最高优先级隐患；多实例部署下限流失效                                                                        | future-directions §9                                                             | todo          |
| E5 CI/CD 演进         | PR 预览部署；CI 中 PostgreSQL 集成测试；多副本下迁移与启动竞态（先 `migrate deploy` 再重启，替代 entrypoint 内迁移）                                                                                                                                       | 预览环境依赖 staging 资源；竞态仅在多副本部署时触发（P1 upon need）                                                       | future-directions §6                                                             | todo          |
| E6 抽象层演进         | Service 实例接入 `createCrudRouter`（NestJS DI）；`FieldDefinition` 扩展 `treeSelect`/颜色/JSON 字段类型；DynamicSelect 支持自定义 optionLabel 渲染                                                                                                        | ADR-004 遗留：生命周期钩子未生效、权限树/自定义渲染受限                                                                   | ADR-004 后续考虑                                                                 | todo          |
| E7 文档补全           | REST 端点与 tRPC 路由清单；错误码手册；部署 Runbook（故障排查/回滚/监控）                                                                                                                                                                                  | 文档体系已就位，参考层仍缺这三份                                                                                          | future-directions §10                                                            | todo          |
| E8 多 Agent 增强      | OpenCode agent 格式转换（3 个 subagent → `.opencode/agent/`）；OpenCode commands 分发；权限配置映射（Claude settings.json → opencode.json permission / Codex approval policy）                                                                             | 技能分发已就位（sync-agents.sh），agents/commands/权限仍是 Claude 专属降级                                                | multi-agent-support 任务                                                         | todo          |
| E9 运行时 AI 演进     | ~~用户端 REST 消费（User 身份 Agent 执行路径 + 用户 JWT 工具转发）；会话/多轮记忆持久化~~（✅ 2026-10-13 随 ADR-006 完成）；~~cron 异步执行~~（✅ 2026-10-14 随 ADR-009 完成，见 E13）；写操作工具 + human-in-the-loop 审批链；队列触发与 durable 断点续跑 | AI 能力目前锁在 Admin（tRPC）；业务系统需要 Agent 写库与长任务——见 [ai-native-roadmap.md](ai-native-roadmap.md) 第 3/4 步 | ADR-005 后续考虑 + 2026-10-13 评估                                               | todo          |
| E10 智能密度          | RAG/向量库、多 Agent 协作、evals 评估、模型路由/fallback；~~成本报表~~（✅ 2026-10-14 随 ADR-007 提前落地，见 E11）                                                                                                                                        | AI 应用高频需求，但依赖 E1-E9 底座；先评估立项再实施                                                                      | 2026-10-13 评估（[ai-native-roadmap.md](ai-native-roadmap.md) 第 5 步）          | todo          |
| E11 LLM 可观测        | `LlmCallLog` 请求级用量埋点（双缓冲/背压/retention）+ 四维透视聚合 + Admin「AI 用量」看板 + `LlmConfig` 单价字段                                                                                                                                           | AgentRun 只有 run 级汇总，无请求级明细与成本归因；提前落地 E10「成本报表」                                                | [wesale-backport-assessment](../dev/wesale-backport-assessment.md) #1（ADR-007） | ✅ 2026-10-14 |
| E12 Settings 参数中心 | `SettingsService` 三层解析（DB→env→derived）+ 最小字段目录 + Admin 配置页 + 配置注入铁律文档                                                                                                                                                               | 平台参数/灰度开关是派生项目通用刚需；回传 weSale 生产事故教训（禁 re-declare ConfigService token）                        | 同上 #2（ADR-008）                                                               | ✅ 2026-10-14 |
| E13 Agent 定时触发    | `AgentTrigger` 表 + CAS 抢占 dispatcher + 泛化 cron→run(agentSlug)；YML `triggers.cron` 运行时生效                                                                                                                                                         | 填补 E9「cron 异步执行」与 YML 预留边界（当前校验通过但静默忽略）                                                         | 同上 #3（ADR-009）                                                               | ✅ 2026-10-14 |
| E14 Admin 组件增量    | StandardListPage 深链（`autoOpenEditParam`）；前端 PermissionGuard super_admin 直通（`showDefaultRowActions` 经核不移植：loom `renderRowActions` 的 helpers 组合参数已是更优解）                                                                           | 深链是通用交互能力；后端三处已有直通、前后端口径对齐                                                                      | 同上 #4                                                                          | ✅ 2026-10-14 |
| E15 文档方法论        | doc-framework.md 并入 docs 体系；backlog「拍板 + 触发条件」记录惯例                                                                                                                                                                                        | 文档治理方法论经生产项目验证，纯文档零风险                                                                                | 同上 #5                                                                          | ✅ 2026-10-14 |
| E16 变更日志          | CHANGELOG.md 文件真理源 + API 解析 + 管理端「更新日志」展示页；登记规则入开发规范（每次改动必做）                                                                                                                                                          | 变更信息散落 git/任务文档，非开发角色无从查看版本变化                                                                     | 2026-10-14 用户需求（[ADR-010](../adr/010-changelog.md)）                        | ✅ 2026-10-14 |

## 拍板记录

> 演进级决策记于此，格式「拍板 + 触发条件」；方向性架构决策入 `docs/adr/`（新开不改历史）。两者互补，不重复记录。

### 2026-10-14 · weSale 基建回哺（E11–E15）实施顺序

- **拍板**：按 E14+E15（热身）→ E11 → E12 → E13 分批实施，每批独立验收合并。依赖单向：E14 的深链/行操作共存是 E11 看板「去调优」与 E13「立即执行」的前置；E12 的 SettingsService 承接 E11 价格兜底与 E13 灰度门控。
- **触发条件**：E11 若 loop 节点埋点代价超预期，可拆「采集先行、看板随后」两步交付；E13 若需求超出 schedule 白名单（任意 cron 表达式），回 ADR-009 重评。

## 已完成（历史，勿重新立项）

- weSale 基建回哺第一批（E11–E15，2026-10-14）：LLM 观测（ADR-007）/ Settings 参数中心（ADR-008）/ Agent 定时触发（ADR-009）/ Admin 组件增量 / 文档方法论——详见各 ADR 与 `docs/task/completed/wesale-backport-*`
- 模块标准化推广至全部业务模块（ADR-004，2026-09 完成）
- 架构治理（健康检查清单、ADR 目录、依赖/清理规则，2026-07）
- 持久化任务追踪系统（2026-07）
- Todo 模块全端覆盖（API/Admin/Web/Miniapp，2026-08）
- LLM 抽象层替代 Dify（D6，2026-08）
- genModule 全端 API 生成覆盖（REST Controller + Admin 三件套 + 两端 client，PRD D7 定界，2026-10）
- 上传模块 local 模式与 OSS 凭证修复（2026-09）
