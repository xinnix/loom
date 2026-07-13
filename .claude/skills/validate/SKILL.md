---
name: validate
description: 全栈验证 — 依次运行类型检查、lint、构建和测试，输出汇总报告
allowed-tools:
  - Bash(pnpm :*)
  - Bash(pnpm --filter :*)
  - Bash(pnpm -C :*)
---

# /validate — 全栈验证

## Overview

运行完整的代码验证管线，依次执行：类型检查 → Lint → 构建 → 测试。每步记录状态和耗时，最后输出汇总表。

## 执行步骤

### 1. 类型检查

```bash
pnpm type-check
```

### 2. Lint

```bash
pnpm --filter admin lint
pnpm --filter @roundtable/web lint
```

### 3. 构建

```bash
pnpm build:shared
pnpm build:api
pnpm build:admin
pnpm build:web
pnpm build:landing
```

### 4. 测试

```bash
pnpm test
pnpm --filter admin run test
pnpm --filter @roundtable/api run test
```

### 5. 输出汇总

每一步独立执行并记录状态，例如：

```
| 步骤       | 状态 | 耗时   |
|-----------|------|--------|
| type-check| ✅   | 8.2s   |
| lint      | ✅   | 3.1s   |
| build     | ❌   | 15.5s  |
| test      | ⏭️   | -      |
```

如果任何步骤失败，在汇总后列出具体错误信息。

## 注意事项

- 先执行 `/sync` 确保 Prisma Client 和共享包是最新的
- lint 只在配置了 `lint` 脚本的 package 中运行（admin、web）
- 测试失败不影响后续步骤，但会在汇总中标记
- 构建失败包含具体模块路径方便定位
