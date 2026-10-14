# ADR-010: 变更日志（CHANGELOG.md 文件真理源 + 管理端展示）

- **日期**：2026-10-14
- **状态**：✅ 已采纳
- **关联**：[backlog E16](../product/backlog.md)；过程规则见 AGENTS.md「开发后必做」

## 背景

项目缺少面向管理端的版本变更日志：变更信息散落在 git 历史、任务文档与 ROADMAP 中，非开发角色（运营/实施/客户）无从查看「这个版本改了什么」。同时需要一条过程纪律——每次改动都产生一条可展示的变更记录。

## 决策

1. **文件真理源：仓库根 `CHANGELOG.md`**，不落数据库。理由：
   - 变更由开发/Agent 随代码提交产生——文件可在同一 commit 内登记（DB 方案要求改动后另行写库，Agent 工作流难以强制）
   - 随仓库版本化、可评审、可 diff；派生项目经 `/init-project` 自然继承机制
   - 与 YML 编排「文件权威 + DB 只存运行期状态」的既有约定同型
2. **约束格式（解析宽容、校验严格）**：`## [版本] - YYYY-MM-DD` 版本节 + `### 新增|变更|修复|移除|安全`（中英文别名归一为 added/changed/fixed/removed/security，Zod 同源）+ `- 条目`。坏版本节跳过并 warn，不整页失败。
3. **读取侧 `ChangelogReader`**：候选路径（dev 仓库根 / 生产镜像 `/app/CHANGELOG.md`，Dockerfile.api 显式 COPY）+ mtime 缓存；文件缺席返回空列表（附属设施不阻断）。类型/关键字过滤在 tRPC router 内存完成（单文件量级）。
4. **管理端只读展示**：`/changelog` Timeline 页（类型 Segmented + 关键字搜索），权限 `changelog:read` + `menu:changelog`。不做管理端编辑——编辑即改文件，保持单一写入路径。
5. **过程纪律**：AGENTS.md/CLAUDE.md「完成后」清单增加登记步骤——可见变化递增版本号（新能力 → 次版本，修复 → 修订号），纯内部调整并入当前版本「变更」组。

## 权衡

**优点**

- 单一写入路径（文件），展示零同步成本；Agent 可执行、可评审
- 机制随脚手架交付，派生项目开箱即得（含展示页）

**缺点**

- 文件格式靠约定维持（靠解析校验 + warn 兜底，不阻断）
- 生产镜像需显式 COPY 文件（新增一条部署关注点）

## 实施要点

- shared：`ChangelogTypeSchema/ChangelogEntrySchema/ChangelogQuerySchema`
- api：`modules/changelog/changelog.reader.ts`（纯 fs 解析，无 DI）+ `changelog.router`（getEntries）
- admin：`modules/changelog/pages/ChangelogPage.tsx` + 路由 `/changelog` + 系统管理菜单
- Dockerfile.api：`COPY --from=builder /app/CHANGELOG.md ./CHANGELOG.md`
- 历史回填：0.1.0–0.5.0 按 ROADMAP/git 历史粗粒度补齐（不虚构细节）

## 后续考虑

- 条目支持链接到任务文档/PR（约定 markdown 链接语法已天然支持）
- 若未来需要用户端（小程序/Web）展示更新公告，可复用同一 router 增加公开只读端点
