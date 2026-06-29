# Seed Data - 创建数据库假数据

快速创建数据库假数据用于开发和测试。

## 使用方法

```bash
/seed-data
```

## 执行步骤

1. 检查 PostgreSQL 容器是否运行
2. 执行基础数据 SQL 脚本（用户、角色、权限）
3. 执行业务数据 SQL 脚本（商户、券模板、订单等）
4. 验证数据创建结果

## 数据内容

### 基础数据（seed-base.sql）

- 3个管理员账户（superadmin/admin/admin@example.com）
- 2个小程序用户（user/user2@example.com）
- 3个角色（超级管理员、管理员、访客）
- 16个权限
- 3个示例 Todos

### 业务数据（seed-data.sql）

- 6个商户（海底捞、星巴克、优衣库、万达影城、肯德基、耐克）
- 4个券模板（火锅券、饮品券、观影券、通用券）
- 4个订单（多种状态：已支付、已核销、未支付）
- 3条新闻（已发布和草稿状态）
- 4个结算单（待结算、已确认、已支付）

## 测试账号

- **管理端**：superadmin@example.com / password123
- **小程序**：user@example.com / password123

## 注意事项

- 确保 PostgreSQL 容器正在运行
- 数据库名称：opencode
- 用户：xinnix
- 如果数据已存在，会跳过插入（ON CONFLICT DO NOTHING）
