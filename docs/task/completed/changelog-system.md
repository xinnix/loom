# 任务：变更日志机制（E16，ADR-010）

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-10-14
- **标签**：`feature`
- **关联**：[ADR-010](../../adr/010-changelog.md)；用户需求「以后每次改动都要形成 changelog，管理端开页展示」

## 目标

建立版本变更日志机制：文件真理源 + API 解析 + 管理端展示页 + 「每次改动必登记」过程规范，并回填历史版本。

## 检查清单

- [x] 根目录 `CHANGELOG.md`：约束格式（版本节 + 类型分组）+ 历史回填 0.1.0–0.6.0（按 ROADMAP/git 粗粒度，不虚构）+ 0.7.0 本特性条目（首次实践）
- [x] shared：`ChangelogTypeSchema/ChangelogEntrySchema/ChangelogQuerySchema`（类型与校验 SSOT）
- [x] API：`modules/changelog/changelog.reader.ts`（纯 fs 解析、mtime 缓存、候选路径 dev/镜像 + `CHANGELOG_FILE` env 覆盖、坏节跳过不整页失败）+ `changelog.router`（getEntries，类型/关键字内存过滤）
- [x] 权限 `changelog:read` + `menu:changelog` 入 registry + seed-base.sql；Dockerfile.api 补 `COPY CHANGELOG.md`
- [x] Admin：`/changelog` Timeline 页（类型 Segmented + 关键字搜索）挂系统管理菜单
- [x] 过程规范：AGENTS.md「开发后必做」与 CLAUDE.md 工作流表新增登记条目（可见变化递增版本号：新能力 → 次版本、修复 → 修订号）
- [x] 测试：reader 3 例（中英文别名归一/坏节跳过/空容错）+ router 4 例（全量/类型过滤/关键字条目级与版本号整节/无权限）

## 当前状态

> **做到哪了：** 全部完成。api 162 例绿、双端 tsc 绿、新文件 lint 0 error。
> **卡在哪：** 无。
> **下一步：** 无——后续每次改动按 AGENTS.md 规范登记 CHANGELOG.md 即可。
> **决策上下文：** 文件真理源而非 DB——变更随代码同 commit 产生（Agent 工作流可强制、可评审、随仓库派生），与「YML 文件权威 + DB 只存运行期状态」约定同型；展示页只读，编辑即改文件，保持单一写入路径；版本头正则不锚定行尾，坏节（日期非法等）靠 Zod 校验兜底跳过。

## 变更文件清单

| 文件                                                         | 变更      | 原因                        |
| ------------------------------------------------------------ | --------- | --------------------------- |
| `CHANGELOG.md`                                               | 新增      | 真理源 + 历史回填           |
| `infra/shared/src/index.ts`                                  | 修改      | changelog Zod 契约          |
| `infra/shared/src/permissions/registry.ts` / `seed-base.sql` | 修改      | 权限                        |
| `apps/api/src/modules/changelog/*`（5 文件）                 | 新增      | reader + router + 两份 spec |
| `apps/api/src/trpc/app.router.ts`                            | 修改      | changelog 注册              |
| `Dockerfile.api`                                             | 修改      | COPY CHANGELOG.md           |
| `apps/admin/src/modules/changelog/*` + App/AdminLayout       | 新增/修改 | 展示页接线                  |
| `AGENTS.md` / `CLAUDE.md`                                    | 修改      | 登记规范入开发流程          |
| `docs/adr/010-changelog.md` + 索引 + backlog/ROADMAP         | 新增/修改 | 治理回写                    |
