---
name: ship
description: 完成功能开发时分批提交并推送。按变更类型分组（schema/基础设施、后端业务逻辑、前端），确认后推送。
---

# Ship — 分批提交并推送

## Overview

完成功能开发后，将工作区的变更按类型分组提交，避免单个巨型 commit。分组策略：

| 分组              | 路径匹配                               | commit 前缀      |
| ----------------- | -------------------------------------- | ---------------- |
| Schema / 基础设施 | `infra/database/**`, `infra/shared/**` | `feat(schema):`  |
| 后端业务逻辑      | `apps/api/**`                          | `feat(api):`     |
| 前端管理后台      | `apps/admin/**`                        | `feat(admin):`   |
| 小程序            | `apps/miniapp/**`                      | `feat(miniapp):` |
| 配置 / 杂项       | 以上均不匹配的文件                     | `chore:`         |

## When to Use

功能开发完成后，准备提交和推送代码时调用。

## Instructions

1. **检查工作区状态**：运行 `git status` 和 `git diff --stat`，确认有未提交的变更。如果工作区干净，告知用户无需操作并结束。

2. **分组文件**：将变更文件按上述规则分类。对每个分组：
   - 列出该组包含的文件
   - 生成合理的 commit message：前缀 + 简要描述（从变更内容推断）
   - 如果某组只有 1-2 个文件且变更很小，可考虑合并到相邻分组

3. **展示提交计划**：向用户展示分组方案，格式如：

   ```
   📦 提交计划（3 个 commit）：

   1. feat(schema): add coupon model and relations
      - infra/database/prisma/schema.prisma
      - infra/database/prisma/migrations/20260522_add_coupon/migration.sql
      - infra/shared/src/zod/coupon.ts

   2. feat(api): add coupon CRUD service and router
      - apps/api/src/coupon/coupon.service.ts
      - apps/api/src/coupon/coupon.router.ts
      - apps/api/src/coupon/coupon.controller.ts

   3. feat(admin): add coupon list and form pages
      - apps/admin/src/pages/coupon/CouponListPage.tsx
      - apps/admin/src/pages/coupon/CouponFormPage.tsx
   ```

4. **执行提交**：按顺序对每组执行 `git add <files>` + `git commit`。commit message 末尾附加 `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`。

5. **确认推送**：展示所有 commit 的摘要（`git log --oneline` 新增部分），询问用户是否推送。确认后执行 `git push`。

## Notes

- 如果用户提供了自定义 commit message 前缀或描述，优先使用用户的
- 迁移文件必须与 schema 变更放在同一个 commit
- `infra/shared` 的变更通常与 schema 变更同组，除非变更独立于 schema
- 如果某个分组为空，跳过该组
- 不处理 `package-lock.json` / `pnpm-lock.yaml` 的单独分组，归入"配置/杂项"
