---
name: deleteModule
description: 删除由 genModule 生成的完整模块 — 清理 Prisma Schema、Zod、Service、Router、Controller、Admin 页面、菜单与路由注册。用户要求删除/移除某个业务模块时使用。
---

# deleteModule Skill

删除由 genModule 生成的完整模块。

## 用法

```bash
node .claude/skills/deleteModule/delete-module.ts <moduleName>
```

### 参数

- `moduleName` - 要删除的模块名称（如：product、order、category）

### 选项

```bash
# 预览模式（不实际删除，只显示将要删除的内容）
node .claude/skills/deleteModule/delete-module.ts product --dry-run

# 强制删除（不确认）
node .claude/skills/deleteModule/delete-module.ts product --force
```

## 功能

自动删除以下内容：

### 后端文件

- `apps/api/src/modules/<moduleName>/` - 整个模块目录
- `apps/api/src/modules/<moduleName>/rest/<moduleName>.controller.ts`
- `apps/api/src/modules/<moduleName>/rest/index.ts`
- `apps/api/src/modules/<moduleName>/services/<moduleName>.service.ts`
- `apps/api/src/modules/<moduleName>/services/index.ts`
- `apps/api/src/modules/<moduleName>/trpc/<moduleName>.router.ts`
- `apps/api/src/modules/<moduleName>/trpc/index.ts`
- `apps/api/src/modules/<moduleName>/module.ts`
- `apps/api/src/modules/<moduleName>/index.ts`

### 前端文件

- `apps/admin/src/modules/<moduleName>/` - 整个模块目录
- `apps/admin/src/modules/<moduleName>/pages/<ModuleName>ListPage.tsx`
- `apps/admin/src/modules/<moduleName>/index.ts`

### 配置文件更新

- `apps/api/src/trpc/app.router.ts` - 移除 router 导入和注册
- `apps/admin/src/App.tsx` - 移除页面导入、路由和资源配置
- `apps/admin/src/shared/layouts/AdminLayout.tsx` - 从 menuConfig 中移除菜单项

### 数据库

- Prisma schema 中的模型（需要手动执行迁移）
- 相关的 Zod schemas（从 `infra/shared/src/index.ts`）

## 示例

```bash
# 删除 product 模块
node .claude/skills/deleteModule/delete-module.ts product

# 预览将要删除的内容
node .claude/skills/deleteModule/delete-module.ts product --dry-run

# 强制删除（跳过确认）
node .claude/skills/deleteModule/delete-module.ts product --force
```

## 注意事项

1. **备份数据** - 删除前请确保已备份重要数据
2. **数据库迁移** - 删除 Prisma 模型后需要手动创建并运行迁移
3. **依赖关系** - 如果其他模块依赖此模块，需要先处理依赖关系
4. **预览模式** - 建议先使用 `--dry-run` 预览将要删除的内容

## 删除后步骤

1. 检查并删除相关的 Prisma migration 文件（可选）
2. 运行 `npx prisma migrate dev` 创建新的迁移以删除数据库表
3. 重启后端和前端服务

## 故障排除

### 问题：文件已手动修改过，无法自动删除

**解决**：手动检查并删除相关文件和配置

### 问题：Prisma 迁移失败

**解决**：

```bash
cd infra/database
npx prisma migrate dev --name drop_<module>
```
