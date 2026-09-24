---
name: scaffold-clean
description: 移除 todo 示例模块，从脚手架中生成一个完全空白的项目。在 /init-project 之后使用。
---

# /scaffold-clean — 移除示例模块

## Overview

将脚手架中的 `todo` 示例模块完全移除，生成一个纯净的空白项目，只保留 auth/RBAC/支付/上传等基础设施。

## 清理内容

### 移除的文件和代码

1. `apps/api/src/modules/todo/` — 后端模块
2. `apps/admin/src/modules/todo/` — Admin 前端页面
3. `apps/miniapp/src/api/todo.ts` — 小程序 API
4. Prisma schema 中 `Todo` 模型
5. `infra/shared/src/index.ts` 中 Todo schemas
6. `PERMISSIONS.TODO` 条目
7. `app.module.ts` 中 TodoModule 导入
8. `app.router.ts` 中 todoRouter 导入
9. `App.tsx` 中 TodoListPage 路由
10. `AdminLayout` menuConfig 中 demo 分组
11. `miniapp` API_ENDPOINTS 中 todo 端点

### 更新 Seed

- 移除 `seed-base.sql` 中 todo 相关权限

## 执行

```bash
# 1. 删除文件
rm -rf apps/api/src/modules/todo
rm -rf apps/admin/src/modules/todo
rm -f apps/miniapp/src/api/todo.ts

# 2. 运行 Prisma 迁移
# 删除 Todo 模型后重新生成迁移
/db-migrate

# 3. 构建验证
/build-all
```
