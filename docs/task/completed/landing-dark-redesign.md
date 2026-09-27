# Landing 深色版重设计整合

- **创建时间**：2026-09-27
- **完成时间**：2026-09-27
- **分支**：main
- **背景**：用户反馈原浅色版"很多字太小"，自行产出了优化版深色 HTML 原型（Tailwind CDN + Material Symbols），本任务将其整合进 `apps/landing`。

## 目标

用用户的深色版原型替换现有 landing 页面，保持 Next.js + Tailwind v4 项目约定。

## 检查清单

- [x] `globals.css`：用户 Tailwind config 迁移为 v4 `@theme` token（色板 / 字体 / 复合字号 / 间距 / 圆角）
- [x] `globals.css`：补 `.material-symbols-outlined` 字体类，清理未使用的 `.mono-label` / `.tech-border` / `.blueprint-grid`
- [x] `layout.tsx`：Google Fonts 换 Inter + JetBrains Mono + Material Symbols，`html` 加 `dark`
- [x] `page.tsx`：原型 JSX 化（className / viewBox / SVG 属性），重复结构数据化，锚点接上真实 section id
- [x] 新增 client 复制按钮组件替代内联 `onclick`
- [x] `transition-all` → `transition-colors`（hover 只变颜色）
- [x] prettier + lint + type-check 通过
- [x] dev server 渲染验证（1920px 桌面 + 390px 移动端截图，全部 section 检查）
- [x] `next build` 生产构建通过（SSG 静态导出正常）

## 变更文件清单

- `apps/landing/src/app/globals.css`（重写：深色 token 体系）
- `apps/landing/src/app/layout.tsx`（字体加载 + dark class）
- `apps/landing/src/app/page.tsx`（整页替换为深色版）
- `apps/landing/src/app/_components/copy-command-button.tsx`（新增：复制安装命令）
- `docs/task/README.md`（看板更新）

## 备注

- 字号体系按用户原型提升：hero 56px / section 标题 40px / 卡片标题 28-20px / 正文 13-15px（原版大量 10px mono-label 已移除）
- 原型的 `data-path` demo 属性已移除，导航锚点改为真实 section id（#architecture / #modules / #cli / #ecosystem / #benchmarks）
- 原型中 3001 端口被其他项目（如故 Remo）占用，验证时临时用了 3101，未改项目配置
- 安装命令文案沿用原型的 `npx create-loom@latest my-app`，与实际发布包名是否一致待用户确认
