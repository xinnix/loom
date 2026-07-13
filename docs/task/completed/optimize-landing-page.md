# 任务：优化 Landing Page

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-07-13
- **标签**：`feature`
- **关联**：无

## 目标

将 Landing 页面简化为更干净、更有力的设计，移除冗余内容（AgentHarness、Donate 等长 section），统一品牌名称为 Loom，并添加一句对 Loom 名称含义的解释。

## 检查清单

- [x] 分析当前 Landing 页全部组件结构
- [x] 重写 Hero 区域 — 简洁有力 + Loom 名称解释
- [x] 精简 Features 区域
- [x] 移除 AgentHarness 模块（过长，不适合 landing）
- [x] 移除 Donate 模块
- [x] 更新 Navbar 品牌名称为 Loom
- [x] 更新 Footer 品牌名称与文案
- [x] 更新 metadata 描述

## 当前状态

> **做到哪了：** 全部完成。类型检查通过，页面响应正常（200 OK）。
> **卡在哪：** 无
> **下一步：** 无

## 变更文件清单

| 文件                                            | 变更 | 原因                            |
| ----------------------------------------------- | ---- | ------------------------------- |
| `apps/landing/src/app/page.tsx`                 | 修改 | 重新编排 section 顺序，移除冗余 |
| `apps/landing/src/app/layout.tsx`               | 修改 | 更新 metadata                   |
| `apps/landing/src/components/navbar.tsx`        | 修改 | 品牌名改为 Loom，简化导航       |
| `apps/landing/src/components/hero.tsx`          | 修改 | 重写为简洁版 + Loom 名称解释    |
| `apps/landing/src/components/features.tsx`      | 修改 | 精简功能卡片                    |
| `apps/landing/src/components/footer.tsx`        | 修改 | 品牌名改为 Loom                 |
| `apps/landing/src/components/agent-harness.tsx` | 删除 | 过长，不适合 landing            |
| `apps/landing/src/components/donate.tsx`        | 删除 | landing 不需要                  |
