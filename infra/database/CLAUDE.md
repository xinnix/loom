# Database (Prisma + PostgreSQL)

## Schema 变更流程

1. 修改 `schema.prisma`
2. `/db-migrate` → 生成迁移 + 应用 + 生成 Client + Seed
3. `/sync` → 重新构建 @roundtable/shared
4. 提交迁移文件到 git

## 关键规则

- **唯一真理源**: `schema.prisma` 是唯一的模型定义来源
- **禁止 db push 到生产**: 必须用 `migrate deploy`
- **迁移文件必须入库**: CI 需要迁移文件才能同步生产库
- **禁止手动编辑迁移文件**: 使用 `npx prisma migrate dev` 生成

## 枚举规范

使用 Prisma `enum` 而非 String + 注释：

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  CANCELLED
}
```

修改枚举后运行 `/enum-sync` 同步到 Zod 和前端。

## 命名规范

- Model: `PascalCase`
- 字段: `camelCase`
- 关系字段: 模型名小写（如 `userId`, `categoryId`）
- 枚举值: `UPPER_SNAKE_CASE`

## 注意事项

- ID 使用 `@default(cuid())`
- 时间字段: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- 软删除: 添加 `deletedAt DateTime?` 字段
- 关系必须双向定义
