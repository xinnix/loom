# Loom 脚手架 PRD

> 新项目接手：init-project 后请将本文件重写为新项目的 PRD（范围边界、F 编号功能规格、决策记录表），本文档章节骨架可保留作模板。重置指引见 [docs/README.md](../README.md#新项目接手指南)。

---

## 范围边界

### In（脚手架内置能力）

- 双用户认证体系（Admin + User，含微信登录）
- RBAC 权限系统与 Permission Registry
- 全栈 CRUD 模块生成（`/genModule` 技能链）
- 多策略文件存储（local / OSS 直传 / 服务端中转）
- 微信支付（JSAPI + 退款）
- LLM 抽象层（agents 模块，多模型配置）
- Todo 示例模块（全端覆盖，作为标准模式参考实现）
- 多端应用壳（Admin / Web / Landing / Miniapp）

### Out（明确不做）

- 任何真实业务功能（见 [vision.md](vision.md) 非目标）
- 多租户 / SaaS 计费体系（派生项目按需自建）
- 非 PostgreSQL 数据库支持

## 功能规格

每个能力一个 F 编号，含验收标准。实现细节以代码为准，本表定义「做到什么程度」。

### F1 双用户认证

Admin 用户（`admins` 表，RBAC）与 User 用户（`users` 表，邮箱 + 微信登录）共存；JWT 携带 `type` 字段区分身份；Web 端 Token 存 httpOnly Cookie，小程序存本地存储。

**验收**：两端各自登录/刷新/登出闭环可用；小程序 User 访问任何管理端路由被拒绝；tRPC context 只解析 Admin 身份。

### F2 RBAC 与 Permission Registry

角色-权限模型；权限常量以类型安全 Registry 维护（非裸字符串）；Admin 端按钮/路由级权限控制。

**验收**：无对应权限的用户不可见对应菜单且 API 调用被拒；Permission 常量重命名时类型检查报错（非运行时静默失败）。

### F3 全栈 CRUD 生成（genModule）

从模块名与字段描述生成：Prisma Model + 迁移 + Zod Schema + Service（继承 BaseService）+ tRPC Router + REST Controller（可选）+ Admin 三页（三大标准组件）+ 菜单/路由注册 + spec 骨架。

**验收**：生成的模块通过[模块健康检查清单](../dev/module-health-checklist.md)全部条目；生成后 `/db-migrate` → `/sync` → `type-check` 全绿。

### F4 多策略文件存储

`FileStorageService` 按 `.env` 配置在 local / OSS 直传 / 服务端中转三种策略间切换；Admin 上传组件自动跟随配置。

**验收**：三种策略各自完成上传→访问 URL→删除闭环；local 模式无 OSS 凭证依赖；策略切换不改业务代码。

### F5 微信支付

JSAPI 下单 + 支付回调 + 退款；证书/密钥配置见 `certs/` 说明。

**验收**：沙箱或真实环境完成「下单 → 回调验签 → 状态更新 → 退款」全链路；回调重复投递幂等。

### F6 LLM 抽象层

agents 模块以通用 LLM 配置（provider/model/apiKey）替代单一平台集成，业务侧面向统一接口。

**验收**：切换 provider 只改数据库配置不改代码；apiKey 不出现在任何日志与前端响应中。

### F7 Todo 示例模块（参考实现）

全端覆盖（API + Admin + Web + Miniapp），演示标准模式的最小完整纵切。

**验收**：`/scaffold-clean` 可一键移除且不留死引用；[todo-reference.md](../dev/todo-reference.md) 描述与代码一致。

## 决策记录

产品/工程决策追加于此（编号递增）；纯技术架构决策记录在 [adr/](../adr/README.md)，此处只引用。

| 编号 | 决策                                                                        | 依据                                                 | 日期       |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ---------- |
| D1   | 双协议架构：Admin tRPC / 外部端 REST                                        | [ADR-001](../adr/001-dual-protocol-architecture.md)  | 2026-07-20 |
| D2   | Admin 前端采用 Refine + Ant Design                                          | [ADR-002](../adr/002-refine-antd-frontend.md)        | 2026-07-20 |
| D3   | 声明式 UI 三件套作为管理端唯一页面模式                                      | [ADR-003](../adr/003-standardized-ui-pattern.md)     | 2026-07-20 |
| D4   | 模块标准化推广至全部业务模块                                                | [ADR-004](../adr/004-module-standardization-push.md) | 2026-07-21 |
| D5   | Seed 数据用 SQL 脚本直灌，不用 Prisma seed（Prisma 7.x adapter 兼容性问题） | `AGENTS.md` Seed 说明                                | 2026-07    |
| D6   | agents 模块以通用 LLM 抽象层替代 Dify 平台集成                              | 解耦单一平台依赖，provider 可配置                    | 2026-08    |

## 北极星指标

脚手架的「产品指标」即派生项目的开发体验：

| 指标                                               | 目标     |
| -------------------------------------------------- | -------- |
| 新项目克隆 → 首个业务模块上线（含初始化）          | ≤ 0.5 天 |
| genModule 生成模块通过健康检查清单比例             | 100%     |
| Admin 端模块页面使用三大标准组件覆盖率             | 100%     |
| 新增一个标准 CRUD 模块的手写代码行数（生成器之外） | ≈ 0 行   |
