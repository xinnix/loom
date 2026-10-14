# Architecture Decision Records (ADR)

本目录记录了 Loom 脚手架的关键架构决策。每个 ADR 描述一个决策的背景、选项、选择和后果。

## 索引

| ADR                                                   | 标题                                                               | 日期       | 状态      |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ---------- | --------- |
| [ADR-001](001-dual-protocol-architecture.md)          | 双协议架构（Admin 端 tRPC，外部端 REST）                           | 2026-07-20 | ✅ 已采纳 |
| [ADR-002](002-refine-antd-frontend.md)                | Admin 前端选择 Refine + Ant Design                                 | 2026-07-20 | ✅ 已采纳 |
| [ADR-003](003-standardized-ui-pattern.md)             | 声明式 UI 模式（StandardForm/StandardListPage/StandardDetailPage） | 2026-07-20 | ✅ 已采纳 |
| [ADR-004](004-module-standardization-push.md)         | 模块标准化推广至全部业务模块                                       | 2026-07-21 | ✅ 已采纳 |
| [ADR-005](005-native-ai-three-layer.md)               | 框架原生 AI 三层架构（LLM / 工具 / Agent 编排）                    | 2026-10-12 | ✅ 已采纳 |
| [ADR-006](006-runtime-ai-user-consumption-session.md) | 运行时 AI 用户端消费与会话持久化（M4 第一批）                      | 2026-10-13 | ✅ 已采纳 |
| [ADR-007](007-llm-call-observability.md)              | LLM 调用观测层（用量埋点管线 + Admin 看板）                        | 2026-10-14 | ✅ 已采纳 |
| [ADR-008](008-settings-platform-parameters.md)        | 平台参数中心（Settings）                                           | 2026-10-14 | ✅ 已采纳 |
| [ADR-009](009-agent-scheduled-trigger.md)             | Agent 定时触发（泛化 cron → run agent）                            | 2026-10-14 | ✅ 已采纳 |
| [ADR-010](010-changelog.md)                           | 变更日志（CHANGELOG.md 文件真理源 + 管理端展示）                   | 2026-10-14 | ✅ 已采纳 |

## 状态说明

| 状态      | 含义                 |
| --------- | -------------------- |
| ✅ 已采纳 | 决策已实施并确认     |
| 🔄 提议中 | 正在讨论，未最终确定 |
| ⏸️ 搁置   | 决策推迟             |
| ❌ 已废弃 | 决策被后续 ADR 替代  |
