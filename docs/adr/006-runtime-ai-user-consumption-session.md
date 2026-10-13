# ADR-006: 运行时 AI 用户端消费与会话持久化（M4 第一批）

- **日期**：2026-10-13
- **状态**：✅ 已采纳

## 背景

ADR-005 交付的 AI 三层架构完成度评估为「Admin 玩具」：REST run 端点虽已支持 user 身份认证、工具转发已带触发者原始 JWT，但存在四个缺口：

1. **无可见性控制**：任何 user 可跑任何激活 agent（`GET /ai/agents` 与 run 均不过滤）
2. **工具权限语义缺失**：user JWT 无 `permissions` 字段（jwt.strategy 仅 admin 注入 RBAC 权限），工具 YML 声明 `permission` 后对 user 永远 block——闸门对 user 无定义
3. **无会话记忆**：每次 run 独立（ADR-005 MVP 边界明确暂缓），聊天类产品语义无法落地
4. **Web 端零消费面**：AI 能力锁在 Admin Playground

本 ADR 打开 ADR-005「MVP 边界」中的「多轮会话持久化」一项，对应用户端 REST 消费路径（[ai-native-roadmap.md](../product/ai-native-roadmap.md) 第 3 步）。写操作工具 + 审批链（第 4 步）另行 ADR。

## 决策

### D1 Agent 可见性：YML `audience` 字段（缺省 admin）

AgentYmlSchema 新增顶层字段 `audience: 'admin' | 'user' | 'all'`，**缺省 `admin`**（新增 agent 默认不暴露给用户端，显式开放）。契约变更走 `infra/shared`（R1 唯一验证真理源），DB Agent 行不加列——可见性是编排语义，真理源在 YML。

- run 端点：`user` 身份调用 `audience: admin` 的 agent → 403
- `GET /ai/agents`（listActive）：按身份过滤——admin 返回全部激活 agent，user 仅返回 `audience ∈ {user, all}` 的激活 agent

### D2 user 身份跳过工具 RBAC 闸门（安全边界不变）

`beforeToolCall` 权限检查仅对 `admin` 身份生效；`user` 身份跳过 YML `permission` 检查。理由：

- user 无 RBAC 体系，permission 字符串对 user 无语义
- 安全边界不依赖此闸门：工具以触发者身份转发原始 user JWT，内部 REST 端点自身的 `JwtAuthGuard` + 数据隔离（`where: { userId }`）保证 blast radius——与 ADR-005 D4「权限跟随人走」一致
- **用户端工具面 = audience 开放的 agent 的 YML tools 并集 ∩ user 可访问的内部端点**，此等式写为本 ADR 威胁模型的 blast radius 声明

### D3 会话模型：AgentSession + AgentMessage（仅用户端）

```
AgentSession        AgentMessage
├─ id               ├─ id
├─ agentSlug（冗余） ├─ sessionId（FK → AgentSession, Cascade）
├─ userId（FK Cascade，归属恒为 User）  ├─ role: 'user' | 'assistant'
├─ title（首条消息截断 50 字符）         ├─ content: text
├─ lastMessageAt（列表排序键）           ├─ runId?（→ AgentRun 审计关联）
└─ createdAt/updatedAt                └─ createdAt
```

- **作用域仅用户端**（已拍板）：会话端点仅接受 `user` 身份，admin 调用 403，防止「Admin 也有会话」的语义漂移；Admin Playground 维持单次 run
- 会话绑定单一 agentSlug，不跨 agent 复用
- 数据隔离红线：所有会话查询强制 `where: { userId: req.user.id }`

### D4 会话 REST API 与 run 端点扩展

信封契约遵循 E4（`{ success, statusCode, message, data, timestamp }`），全部在 `ai/agents` controller 同文件：

| 端点                        | 说明                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `POST /ai/sessions`         | 建 会话 `{ agentSlug }` → 返回会话（校验 agent 存在且 audience 开放） |
| `GET /ai/sessions`          | 当前用户会话列表（`?agentSlug=` 可选过滤，按 lastMessageAt 倒序）     |
| `GET /ai/sessions/:id`      | 会话 + 消息列表（恢复上下文）                                         |
| `DELETE /ai/sessions/:id`   | 删会话（消息级联）                                                    |
| `POST /ai/agents/:slug/run` | 请求体扩展 `sessionId?`                                               |

run + sessionId 语义：**显式建会话，run 携带**（不自动建——保持「无 sessionId = 独立 run」现状语义不漂移）：

1. 校验会话存在且 `userId` 归属当前用户、`agentSlug` 与路由一致
2. 用户消息文本取 `input.message`（String 必填，会话模式输入契约）→ 写入 AgentMessage（role=user）
3. 历史注入（D5）→ run → run output 写入 AgentMessage（role=assistant，关联 runId）→ 更新 session.lastMessageAt（首条消息时生成 title）

SSE 事件协议**零变更**：sessionId 由客户端持有（建会话时已取得），run_start 无需回传。

### D5 历史注入：第一个节点前置最近 20 条

会话模式下，workflow 首个节点（chat 或 loop）的输入 messages 前置该会话**最近 20 条**历史消息（user/assistant 交替，assistant 取 AgentMessage.content）。上限 MVP 硬编码，不做 YML 配置（有真实需求再加字段）。

- chat 节点：`messages = [...history, { role: 'user', content: rendered prompt }]`
- loop 节点：agentLoop 初始 transcript 同样前置

会话型 agent 的 YML 输入契约：模板消费 `{{input.message}}`（如 `prompt: {{input.message}}`）；非会话 agent 不受影响。

## 威胁模型增量（OWASP 对标）

- **用户端工具面扩大**：此前工具仅 admin 触发；现在 user 可触发 audience 开放 agent 的全部工具。缓解：blast radius 等式（D2）+ 工具仅映射本机回环白名单端点 + 内部端点自身鉴权与数据隔离不依赖 Agent 层。
- **会话越权**：所有会话端点与 run 携带的 sessionId 强制归属校验（user 只能读写自己的会话）。
- **间接 prompt injection（继承 ADR-005）**：历史消息是用户自己产出的内容，注入面不变；工具结果仍仅来自启动校验过的白名单端点。
- **拒绝服务**：会话无消息数上限，run 侧 token 预算与 maxIterations 闸门（ADR-005 D7）继续兜底单次 run 成本。

## MVP 边界（明确不做）

- Admin Playground 会话化（维持单次 run）
- 会话标题 AI 摘要（截断首条消息 50 字符）
- 会话级 token 配额 / 消息数上限
- 消息编辑 / 重发 / 分支
- 跨 agent 会话、长期记忆 / RAG（第 5 步评估）
- Web 聊天页的「聊天产品化」打磨（示范页定位，与 Todo 示范同逻辑）

## 权衡

### 优点

- 用户端消费路径与 Admin 共用同一 runtime / SSE 协议 / 工具层，零平行栈
- audience 缺省保守（admin），派生项目显式开放，误暴露风险低
- 会话与 AgentRun 通过 runId 关联，observability 不断层
- 打开边界项均有明确「不做什么」清单，防止范围蔓延

### 缺点

- 会话模式下 `input.message` 契约对复杂输入型 agent 不适用（多字段输入的 agent 不支持会话——当前无此需求）
- 同步执行 + SSE 长连接占 HTTP 生命周期的限制继承 ADR-005（队列化仍属后续演进）
- 历史注入为「整体前置」，超长会话的早期上下文被静默丢弃（20 条硬编码，无提示）——记 warning 可后续补

## 实施要点

1. `infra/shared`：AgentYmlSchema 加 `audience` + 单测 → build
2. `schema.prisma`：AgentSession + AgentMessage → `/db-migrate`
3. API 端：loader 透出 audience；controller 加 4 个会话端点 + run 扩展（归属校验/消息写入）；runtime 历史注入（chat/loop 两路径）；工具闸门 user 跳过
4. Web 端：`lib/ai-api.ts` + `(protected)/ai/chat` 示范页（会话列表 + fetch stream 流式聊天）
5. 示范 YML：simple-chat 改 `audience: all` + `{{input.message}}` 模板；todo-analyst 改 `audience: all`
6. 验证：shared 单测 + api router/controller spec + type-check + 浏览器实测（Web 登录 → 建会话 → 流式对话 → 历史恢复）

## 后续考虑

- 写操作工具 + human-in-the-loop 审批链（M4 第二批，另立 ADR）
- 历史注入超限 warning；会话配额
- Admin Playground 按需会话化（如多轮编排调试成为高频需求）
