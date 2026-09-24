# 任务：文档体系重设计

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-09-24
- **标签**：`docs`
- **关联**：[architecture-governance](architecture-governance.md)

## 目标

基于 Doc Framework（vision → prd → mvp → backlog → ROADMAP → dev/ops → archive）重组 docs/ 为分层文档体系，修复全仓幽灵引用，AGENTS.md 重写对齐。

## 检查清单

- [x] 迁移现有文档到 dev/、ops/、archive/（git mv + 归档标注）
- [x] 新建 product/ 四文档（vision/prd/mvp/backlog）
- [x] 新建根级 ROADMAP.md
- [x] 重写 docs/README.md（体系索引 + 配合规则 + 新项目接手指南）
- [x] 引用修复：CLAUDE.md / README.md / README.en.md / certs/README.md / wechat-pay.service.ts
- [x] AGENTS.md 重写对齐新体系
- [x] CLAUDE.md 增补「文档体系」工作流规则
- [x] init-project 技能补充 docs 接手引导
- [x] 验证：全仓零幽灵引用、相对链接可解析、表格语法一致

## 当前状态

> **做到哪了：** 全部完成。新建 docs/README.md（体系入口）、ROADMAP.md、product/ 四文档；dev/ops/archive 迁移就位；修复 10 处引用（CLAUDE.md/README×2/certs×2/service.ts 日志/2 个 task 历史文档的移动断链等）；AGENTS.md 重写；CLAUDE.md 与 init-project 技能配套更新
> **卡在哪：** 无
> **下一步：** 无（待用户 review 后提交）
> **决策上下文：** 脚手架自身即体系实例（product 层真实运作非空壳）；task/ 保留为执行级追踪，与 backlog（epic 级）分层；ADR 记技术决策、prd 决策表记产品决策，互相引用；backlog 按 2026-09 现状建池（future-directions 中已完成项入 ROADMAP 历史不重复立项）

## 变更文件清单

| 文件                                                                      | 变更            | 原因                           |
| ------------------------------------------------------------------------- | --------------- | ------------------------------ |
| `docs/README.md`                                                          | 重写            | 体系索引 + 配合规则 + 接手指南 |
| `docs/ROADMAP.md`                                                         | 新增            | 根级阶段台账                   |
| `docs/product/{vision,prd,mvp,backlog}.md`                                | 新增            | 产品层四件套                   |
| `docs/dev/*`、`docs/ops/*`                                                | 移入（git mv）  | 参考层分层                     |
| `docs/archive/{refactoring-summary,future-directions}.md`                 | 移入 + 归档标注 | 被取代                         |
| `CLAUDE.md`                                                               | 修改            | 清单路径 + 文档体系规则        |
| `AGENTS.md`                                                               | 重写            | 过时内容 + 幽灵引用            |
| `README.md` / `README.en.md` / `certs/README.md`                          | 修改            | 幽灵引用修复                   |
| `apps/api/.../wechat-pay.service.ts`                                      | 一行            | 日志指向不存在的文档           |
| `.claude/skills/init-project/SKILL.md`                                    | 修改            | docs 产品层接手引导            |
| `docs/task/completed/{module-standardization,architecture-governance}.md` | 一行×2          | 修复移动造成的断链             |

## 备注

- 验证结论：全仓 markdown 链接/路径引用闭环（剩余 3 处为归档与历史任务文档正文的冻结性历史引用，移动前即如此，按归档冻结原则保留）
- `test-loom/` 为 gitignore 的本地测试副本，不在治理范围
- 预先存在的问题（未动）：`wechat-pay.service.ts` L251/L309 有未使用变量 `headers` 的 lint 提示
