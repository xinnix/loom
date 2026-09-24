---
name: db-migrate
description: 运行数据库迁移并重新生成 Prisma 客户端，然后执行 seed。Schema 变更后的标准流程入口。
allowed-tools:
  - Bash(cd :*)
  - Bash(npx prisma migrate dev:*)
  - Bash(npx prisma migrate deploy:*)
  - Bash(npx prisma generate:*)
  - Bash(docker exec:*)
  - Bash(psql:*)
---

# /db-migrate — 数据库迁移

## Overview

Schema 变更后的标准流程入口。在本地生成迁移 SQL、应用到数据库、重新生成 Prisma Client、执行 Seed。

## 执行步骤

1. **生成并应用迁移**

   ```bash
   cd infra/database && npx prisma migrate dev --name <descriptive-name>
   ```

   这会自动生成迁移文件、应用到本地 PostgreSQL、重新生成 Prisma Client。

2. **执行 Seed 数据**

   ```bash
   cd infra/database && npx prisma db seed
   ```

3. **同步工作区**
   ```bash
   cd infra/database && npx prisma generate
   pnpm -C packages/shared build
   ```

## 最终检查

```bash
git status                              # 确认迁移文件已生成
cd infra/database/prisma/migrations/    # 检查迁移 SQL 是否正确
```

## 注意事项

- 执行前确保 PostgreSQL 容器正在运行
- `--name` 参数使用简短描述性英文，如 `add_product_table`
- 迁移文件必须提交到 git（CI 通过 `prisma migrate deploy` 同步生产库）
- **禁止**使用 `prisma db push`（不生成迁移记录，生产环境无法复现）

## 区别对比

| 命令                    | 适用环境 | 生成迁移文件         | 安全        |
| ----------------------- | -------- | -------------------- | ----------- |
| `prisma migrate dev`    | 本地开发 | ✅                   | ✅          |
| `prisma migrate deploy` | 生产/CI  | ❌（只应用已有迁移） | ✅          |
| `prisma db push`        | 原型验证 | ❌                   | ❌ 生产禁用 |
