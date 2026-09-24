# 任务：Landing 介绍随近期改进更新

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-09-24
- **标签**：`docs`
- **关联**：[multi-agent-support](multi-agent-support.md)

## 目标

让落地页（`apps/landing/src/app/page.tsx`）反映近期改进：多 Agent 支持、真实技能数量、正确的命令名与 npm 包名。

## 检查清单

- [x] Hero 徽章升级为四工具（Claude Code · Codex · OpenCode · ZCode 开箱即用）
- [x] 数字修正：18 技能 / 11 命令 / 9 钩子（原 19/10/07）
- [x] 核心大块改「多 Agent 指令协议」+ 四工具 chips（替换不存在的 /GEN-MODULE 等假命令）
- [x] 对比表新增「Agent 生态」行；/GEN-MODULE → genModule
- [x] Terminal 包名修正：npx create-loom@latest → npx @xinnix/create-loom（npm 实测 v0.0.6）
- [x] Terminal 输出补 Miniapp:8080；钩子小块描述改为实际行为
- [x] layout.tsx metadata 同步多工具定位
- [x] 验证：tsc --noEmit 通过 + dev server 全页截图渲染正确

## 当前状态

> **做到哪了：** 完成并验证
> **卡在哪：** 无
> **下一步：** 无
> **决策上下文：** 实际渲染的是 page.tsx 内联页面，components/ 下 9 个组件未被引用（死代码，未动，已向用户报告）

## 备注

- **预存在问题（未修）**：`next build` 崩溃（The "id" argument must be of type string）为 vercel/next.js#95400 —— TS 7 原生编译器与 Next build worker 不兼容，landing pin 了 typescript ~7.0.2。CI/Docker 构建受影响；workaround 是回退 TS 5.x，属版本决策待用户定夺
- 本地验证曾触发 Next 自动 install 弄脏 pnpm-lock.yaml 与 next-env.d.ts，均已 git checkout 恢复
