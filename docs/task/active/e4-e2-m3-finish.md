# E4 + E2 收尾 M3

## 概述

[ai-native-roadmap.md](../../product/ai-native-roadmap.md) 推进顺序第 2 步，M3 收尾双项。完成后 M3 关闭、进入 M4（运行时 AI 演进）。

- **E2 strict 类型安全**（先做）：API 与 Admin 开启 TS strict，消除 `as any`；`types/api.ts` 的 `AppRouter = any` 换真实类型。strict 是 AI 生成代码的第二道自动验证，先于 E4 保证生成器目标态健康。
- **E4 genModule 全端输出**：生成 Web 端 REST + 页面、miniapp 页面（当前仅 API client）；沉淀 `web-api` / `web-page` 技能。

## 检查清单

### E2 strict 类型安全 ✅

- [x] 侦察：api 开 strict 仅 2 错（@types/pg 双版本冲突，卸载即愈）；admin 真实 24 错（root references 模式此前不真查）
- [x] api tsconfig 开启 strict 全绿（顺手开 declaration 供类型桥使用）
- [x] admin tsconfig（app/node）开启 strict，修复 24 处类型错误（refine v5 返回结构、Record<boolean> 索引、闭包收窄丢失、AntD 规则类型等）
- [x] `AppRouter = unknown` → 经 workspace 包（@loom/api devDep + dist d.ts）引用真实类型，tRPC 端到端类型打通
- [x] scripts/type-check.sh 的 admin 检查改 `tsc -b`（原 `tsc --noEmit` 对 references 不真查）
- 注：base.service / trpc.helper 的 21 处 `as any` 在 strict 下不报错（any 显式），收紧至 unknown 属后续演进（见 backlog E6）

### E4 genModule 全端输出

- [ ] Web 端 REST client 生成模式（web-api）
- [ ] Web 端页面生成模式（web-page：list/create/detail）
- [ ] miniapp 页面生成模式
- [ ] genModule 主技能编排扩展（按端选择输出）
- [ ] 以新模块端到端验证生成产物可运行

## 当前状态

🔨 E2 已完成（2026-10-13），E4 实施中。

## 变更文件清单

（E2 部分）apps/api/tsconfig.json + package.json（strict/declaration/types 入口）、apps/admin/tsconfig.*.json + package.json（strict + @loom/api devDep）、src/types/api.ts（真实 AppRouter）、App.tsx / AdminDetailPage / RoleDetailPage / UserDetail / UserListPage / StandardForm×2 / StandardListPage / trpcClient / dataProvider（24 处类型修复）、scripts/type-check.sh、pnpm-lock.yaml
