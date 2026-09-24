# Loom 脚手架 Backlog

> 新项目接手：init-project 后请清空本表，改为新项目的 epic 任务池（每行：做什么/为什么/来源）。重置指引见 [docs/README.md](../README.md#新项目接手指南)。

---

已确认待做的 epic 级任务池。**只写做什么/为什么，不写规格与排期**；规格进入对应 PRD 修订，排期由 [ROADMAP.md](../ROADMAP.md) 阶段体现，执行时在 `../task/active/` 建任务文档。来源标注提出出处；[archive/future-directions.md](../archive/future-directions.md) 为历史汇总，以其条目在本表的现状修正为准。

## 任务池

| Epic             | 做什么                                                                                                                                                                         | 为什么                                                                     | 来源                                         | 状态 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------- | ---- |
| E1 测试体系      | Playwright E2E（Admin CRUD 路径、Web 登录→Todo 流）；API 集成测试（测试 PostgreSQL 跑真实 Prisma）；genModule 生成的 spec 增加权限/搜索/筛选用例                               | 抽象层已有 118 组件用例，缺端到端集成验证                                  | future-directions §4                         | todo |
| E2 类型安全      | API 与 Admin 开启 TS strict（先修复 base.service / trpc.helper 的 `as any`）；消除 `types/api.ts` 的 `AppRouter = any`                                                         | 核心抽象层与端到端类型目前绕过编译期检查                                   | future-directions §7、CLAUDE.md Known Issues | todo |
| E3 安全加固      | Agent `apiKey`、Wecom `secret` 落库加密；Dockerfile 非 root 用户；限流状态外置（当前内存 Map 多实例失效）；Web 端 CSRF 防护                                                    | 密钥明文是现存最高优先级隐患；多实例部署下限流失效                         | future-directions §9                         | todo |
| E4 全端生成覆盖  | genModule 扩展输出 Web 端 REST + 页面、miniapp 页面（当前仅 API client）；新增 `web-api` / `web-page` 技能                                                                     | Todo 的 Web/miniapp 页面目前为手写，未沉淀为生成模式                       | future-directions §2/§3/§5                   | todo |
| E5 CI/CD 演进    | PR 预览部署；CI 中 PostgreSQL 集成测试；多副本下迁移与启动竞态（先 `migrate deploy` 再重启，替代 entrypoint 内迁移）                                                           | 预览环境依赖 staging 资源；竞态仅在多副本部署时触发（P1 upon need）        | future-directions §6                         | todo |
| E6 抽象层演进    | Service 实例接入 `createCrudRouter`（NestJS DI）；`FieldDefinition` 扩展 `treeSelect`/颜色/JSON 字段类型；DynamicSelect 支持自定义 optionLabel 渲染                            | ADR-004 遗留：生命周期钩子未生效、权限树/自定义渲染受限                    | ADR-004 后续考虑                             | todo |
| E7 文档补全      | REST 端点与 tRPC 路由清单；错误码手册；部署 Runbook（故障排查/回滚/监控）                                                                                                      | 文档体系已就位，参考层仍缺这三份                                           | future-directions §10                        | todo |
| E8 多 Agent 增强 | OpenCode agent 格式转换（3 个 subagent → `.opencode/agent/`）；OpenCode commands 分发；权限配置映射（Claude settings.json → opencode.json permission / Codex approval policy） | 技能分发已就位（sync-agents.sh），agents/commands/权限仍是 Claude 专属降级 | multi-agent-support 任务                     | todo |

## 已完成（历史，勿重新立项）

- 模块标准化推广至全部业务模块（ADR-004，2026-09 完成）
- 架构治理（健康检查清单、ADR 目录、依赖/清理规则，2026-07）
- 持久化任务追踪系统（2026-07）
- Todo 模块全端覆盖（API/Admin/Web/Miniapp，2026-08）
- LLM 抽象层替代 Dify（D6，2026-08）
- 上传模块 local 模式与 OSS 凭证修复（2026-09）
