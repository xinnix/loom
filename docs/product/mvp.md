# 新项目落地剧本（MVP）

> 新项目接手：本文档即「从克隆到首个业务模块上线」的剧本，派生项目可直接沿用步骤结构，替换其中的项目特定内容。重置指引见 [docs/README.md](../README.md#新项目接手指南)。

---

本剧本面向实施者/FDE，回答「第一个版本怎么跑通」。功能规格见 [prd.md](prd.md) 对应 F 编号，操作细节以技能与 ops 文档为准，此处不复述。

## 前置条件

- Node.js + pnpm + Docker（PostgreSQL）
- Claude Code（技能链依赖 `.claude/` 目录）

## 端到端步骤

### Step 1 — 获取与安装

```bash
git clone <repo> my-project && cd my-project
pnpm install
```

### Step 2 — 初始化项目身份

运行 `/init-project`：交互式替换包名、数据库名、容器名、管理端标题、品牌文案、域名。脚本覆盖不到的点（README 溯源、docs 产品层重置）见技能内提示与 [README 新项目接手指南](../README.md#新项目接手指南)。

→ verify: 全仓 grep 旧身份标识（`loom`）只剩合理残留；`.env` 就绪（参考 [ops/env-configuration-guide.md](../ops/env-configuration-guide.md)）

### Step 3 — 数据库与启动验证

```bash
/db-migrate      # 迁移 + Prisma Client + Seed
/start-all       # 启动全部服务
```

→ verify: API / Admin / Web / Landing / Miniapp 全部可访问；用 Seed 测试账号（`superadmin@example.com / password123`）登录 Admin 成功

### Step 4 — （可选）清空示例模块

`/scaffold-clean` 移除 Todo 示例模块，得到空白项目。保留亦可——Todo 是标准模式的活参考（[dev/todo-reference.md](../dev/todo-reference.md)）。

→ verify: 若执行，`/type-check` 全绿，Admin 菜单无 Todo

### Step 5 — 首个业务模块

`/genModule <name>` 按交互生成全栈 CRUD（Schema → 迁移 → Zod → Service → Router → Admin 三页 → 注册）。生成后：

```bash
/db-migrate && /sync && /type-check
```

→ verify: 新模块通过[模块健康检查清单](../dev/module-health-checklist.md)；Admin 端完成一次创建/编辑/删除闭环

### Step 6 — 部署

按 [ops/deployment.md](../ops/deployment.md) 执行 Docker 部署与迁移。生产只走 `migrate deploy`（[vision.md](vision.md) R2 红线）。

## 上线检查清单

- [ ] `.env` 生产值全部就位（JWT 密钥非默认值、数据库连接、对象存储凭证）
- [ ] `migrate deploy` 在生产执行成功且迁移记录入库
- [ ] Seed 测试账号已删除或改密
- [ ] Admin 超级管理员密码已更换
- [ ] 微信支付/登录凭证为生产配置（见 `certs/README.md`）
- [ ] 部署后冒烟：登录 → 列表 → 创建 → 上传（如启用）

## 验证指标

对应 [prd.md](prd.md) 北极星指标：本剧本 Step 1 → Step 5 应在 **0.5 天**内完成；超时即在 backlog 记录卡点（哪一步超预期 = 脚手架缺口）。
