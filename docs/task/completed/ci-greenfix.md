# 任务：CI 全绿修复（TS7 lint 崩溃 + format 欠账）

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-09-24
- **标签**：`bugfix`
- **关联**：[landing-copy-refresh](landing-copy-refresh.md)

## 目标

推送 landing 修复后 CI lint job 仍失败，根治 TypeScript 7 与 eslint 工具链不兼容问题，恢复 CI（lint + format check）全绿。

## 检查清单

- [x] 定位根因：typescript-estree 在 TS7 下读 `ModuleKind.Cjs` 崩溃（与 landing build 同根，vercel/next.js#95400 同源；typescript-eslint 8.x peer 范围 `<6.1.0`，最新 8.70.1 仍未支持 TS7）
- [x] web/admin typescript ~7.0.2 → ~5.9.3（与 landing 已验证组合一致；api 的 TS 6 本就正常未动）
- [x] admin eslint 复活后暴露 27 个历史 error：13 处 unused vars 修复（AdminDetailPage/AdminListPage/UserDetail/UserForm/UserDetailPage）
- [x] `react-refresh/only-export-components` 关闭（与脚手架 Form+配置同文件模式冲突，genModule 同构）
- [x] AuthContext set-state-in-effect 行级 disable（setState 均在 await 后，规则不跨 async 边界的误报）
- [x] format check 欠账：格式化 10 个历史文件；next-env.d.ts 与 miniapp 生成物（manifest/pages.json）加入 .prettierignore
- [x] miniapp 为第三个 TS7 崩点（其 package.json 有独立 lint-staged 跑 `eslint --fix`）：TS 回退后暴露 152 个历史违规——149 个 `--fix` 自动修复（分号等风格），3 处 `catch (err)` 未用参数改无绑定 catch
- [x] 验证：全仓 lint 0 errors、format check 全绿、type-check 全绿、admin/landing build 通过

## 当前状态

> **做到哪了：** 完成
> **卡在哪：** 无
> **下一步：** 无
> **决策上下文：** 回退选 5.9.3 而非升 typescript-eslint（8.70.1 仍不支持 TS7）或统一 TS 6（api 已在 6 但 Next 组合未验证）——选已验证组合最小风险；TS7 崩点共四处：landing build、web/admin eslint、root husky pre-commit、miniapp lint-staged（各包独立 lint-staged 配置）；web build 本地因 Google Fonts 网络受限无法验证（next/font build 时下载），CI 海外 runner 可过，属环境限制非代码问题

## 变更文件清单

| 文件                                         | 变更           | 原因                    |
| -------------------------------------------- | -------------- | ----------------------- |
| `apps/{web,admin}/package.json` + lockfile   | TS ~5.9.3      | 修复 eslint 崩溃        |
| `apps/admin/src/modules/**` 5 文件           | 删 unused vars | eslint 复活后的历史欠账 |
| `apps/admin/eslint.config.js`                | 规则关闭       | 与脚手架模式冲突        |
| `apps/admin/src/shared/auth/AuthContext.tsx` | 行级 disable   | react-hooks 误报        |
| `.prettierignore` + 10 个历史文件            | ignore/格式化  | format check 欠账       |

## 备注

- admin/miniapp/infra/root 的 TS7 声明中，miniapp（无 eslint 配置）与 infra/root 未回退——无受害证据，避免超范围改动；后续 TS 统一策略进 backlog
