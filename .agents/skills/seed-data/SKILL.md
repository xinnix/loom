# Seed Data Skill

快速创建数据库假数据用于开发和测试。

## 概述

由于 Prisma 7.x 和某些 adapter 配置存在兼容性问题，本项目使用纯 SQL 脚本创建假数据，确保稳定性和可靠性。

## 执行命令

```bash
/seed-data
```

## 执行流程

1. **检查环境**：验证 PostgreSQL 容器是否运行
2. **执行基础数据**：创建用户、角色、权限等基础数据
3. **执行业务数据**：创建商户、券模板、订单等业务数据
4. **验证结果**：统计并显示创建的数据数量

## SQL 脚本位置

- `infra/database/prisma/seed-base.sql` - 基础数据脚本
- `infra/database/prisma/seed-data.sql` - 业务数据脚本

## 创建的数据详情

### 1. 基础数据（seed-base.sql）

**管理员账户（3个）**

- superadmin@example.com（超级管理员）
- admin@example.com（管理员）
- viewer@example.com（访客）
- 密码：全部为 `password123`

**小程序用户（2个）**

- user@example.com（测试用户，手机号：13800138000）
- user2@example.com（测试用户2）
- 密码：全部为 `password123`

**角色系统**

- 3个角色：超级管理员、管理员、访客
- 16个权限：涵盖 todo、user、admin、resource 的 CRUD 操作
- 角色权限关联已配置

**示例数据**

- 3个示例 Todos（关联到 user@example.com）

### 2. 业务数据（seed-data.sql）

**商户（6个）**

- 海底捞火锅（餐饮，3F）
- 星巴克咖啡（餐饮，1F）
- 优衣库（购物，2F）
- 万达影城（娱乐，5F）
- 肯德基（餐饮，1F）
- 耐克（购物，3F）

**券模板（4个）**

- 50元代100元火锅券（库存：1000）
- 星巴克30元饮品券（库存：500）
- 9.9元观影特惠券（库存：2000）
- 100元美食通用券（库存：300）

**订单（4个）**

- 已支付并核销的火锅券订单
- 已支付未核销的饮品券订单
- 已支付并核销的观影券订单
- 未支付的火锅券订单

**新闻（3条）**

- 春季美食节盛大开幕（已发布，1523次浏览）
- 新商户入驻：耐克旗舰店（已发布，856次浏览）
- 五一劳动节促销活动预告（草稿，342次浏览）

**结算单（4个）**

- 海底捞 2024-02 月度结算（已支付）
- 星巴克 2024-02 月度结算（已支付）
- 万达影城 2024-02 月度结算（已确认）
- 海底捞 2024-03 月度结算（待结算）

## 数据库配置

- **容器名**：postgres
- **数据库名**：opencode
- **用户名**：xinnix
- **密码**：x12345678

## 测试账号

管理端登录：

- Email: `superadmin@example.com`
- Password: `password123`

小程序登录：

- Email: `user@example.com`
- Password: `password123`

## 手动执行（可选）

如果需要手动执行或调试：

```bash
# 检查 PostgreSQL 容器
docker ps | grep postgres

# 执行基础数据
docker exec -i postgres psql -U xinnix -d opencode < infra/database/prisma/seed-base.sql

# 执行业务数据
docker exec -i postgres psql -U xinnix -d opencode < infra/database/prisma/seed-data.sql

# 验证数据
docker exec -i postgres psql -U xinnix -d opencode -c "SELECT '商户: ' || COUNT(*) FROM merchants UNION ALL SELECT '券模板: ' || COUNT(*) FROM coupon_templates;"
```

## 注意事项

1. **幂等性**：脚本使用 `ON CONFLICT DO NOTHING`，可以重复执行而不会报错
2. **依赖关系**：业务数据依赖基础数据，必须先执行 seed-base.sql
3. **数据持久性**：数据直接写入 PostgreSQL，重启容器不会丢失
4. **生产环境**：⚠️ 切勿在生产环境执行这些 seed 脚本

## 故障排查

**问题：容器未运行**

```bash
docker start postgres
```

**问题：数据库连接失败**

```bash
# 检查数据库是否存在
docker exec -i postgres psql -U xinnix -l | grep opencode

# 如果不存在，创建数据库
docker exec -i postgres psql -U xinnix -c "CREATE DATABASE opencode;"
```

**问题：表不存在**

```bash
# 运行数据库迁移
pnpm --filter @opencode/database prisma migrate dev
```
