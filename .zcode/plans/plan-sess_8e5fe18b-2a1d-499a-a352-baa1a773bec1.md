# Landing 浅色改版 + AI 板块 + Changelog 页

## Context

Landing（`apps/landing`，Next.js SSG 静态导出，GitHub Pages 部署）目前是硬编码的深色终端风：暗色 token 全部写在 `globals.css` 的 `@theme` 里，`layout.tsx:22` 还挂着 `className="dark"`。用户要求：**改浅色简洁风**、**删掉底部捐款栏**、**把最新加入的框架原生 AI 三层架构能力（ADR-005~009）作为卖点融入首页**、**新增 changelog 页面**（数据源为根 `CHANGELOG.md`，9 个版本节，格式 `## [版本] - 日期` + `### 新增/变更/修复/移除/安全`）。

实现时遵循项目的 `frontend-design` 技能（.zcode/skills/frontend-design）。

## 改动清单

### 1. 浅色简洁主题（核心）

**`src/app/globals.css`** — 重写 `@theme` 色板（其余 token 机制不动）：

- 背景：canvas `#f8fafc`（slate-50），surface 系全部换白色/浅灰层次，`surface-acrylic` 换浅色毛玻璃
- 主色保留 mint 绿品牌（与管理端一致），但换浅底下可读的 emerald-600 系（`#059669`），text 系换 slate-900/slate-500，`border-subtle` 换 `rgba(15,23,42,0.08)`
- base 层：`color-scheme: light`，body 背景/文字换浅色
- 字体微调：正文从全 JetBrains Mono 改 Inter（保留 mono 用于代码/命令/标签，呼应"简洁"）

**`src/app/layout.tsx`** — 移除 `className="dark"`。

**`src/app/page.tsx`** — 清理硬编码暗色：背景光晕层 `rgba(5,7,10,0)`、网格线 `rgba(255,255,255,0.02)`、SVG 内 `#10B981/#38BDF8` 填充、各处深色 shadow，逐一换浅色等价物。布局结构保持不变（低风险改版）。

### 2. 删除捐款栏

- 删 `SPONSOR_CHANNELS` 常量（page.tsx:148-169）与 `#ecosystem` section（L781-828）
- `NAV_LINKS` 删「生态网络」（L7）；`FOOTER_LINKS`「开源社区」（L176）改指 GitHub 仓库

### 3. 融入 AI 能力（新 section `#ai`，插在架构 Bento 之后）

基于 `apps/api/src/ai/`（ADR-005）与 ADR-006/007/009 的真实能力，三张卡片：

- **LLM 调用抽象**：OpenAI 兼容多厂商（OpenAI/DeepSeek/Qwen/vLLM/Ollama）、流式 + 函数调用、apiKey AES-256-GCM 加密落库、换模型只改配置不改代码
- **YML 声明式工具**：内部 REST 端点声明式映射、JSON Schema 校验失败回喂自纠、权限闸门先于执行、结果截断（OWASP 对标）
- **YML Agent 编排**：SSE 事件流协议、loop 工具循环、token 预算熔断 + maxIterations 防失控、cron 定时触发（多实例幂等）
- 底部辅助条：用户端 AI 会话（audience 可见性）、请求级用量/成本看板、Admin Playground
- 配套小改：`NAV_LINKS` 加「AI 引擎」；header 版本徽章 `v0.1` → `v0.8`（顺手修正过期版本）；hero 指标行提一句「框架原生 LLM」

### 4. 新增 `/changelog` 页面

**新建 `src/app/changelog/page.tsx`**（server component，构建期执行，SSG 无运行时问题）：

- `fs.readFileSync` 仓库根 `CHANGELOG.md`：候选路径探测（`process.env.CHANGELOG_FILE` → `path.join(process.cwd(), '../..', 'CHANGELOG.md')` 等，参照 `apps/api/src/modules/changelog/changelog.reader.ts:64-82`），读不到降级为空态，不炸构建
- 解析逻辑移植该文件的三个正则状态机（`VERSION_RE/SECTION_RE/ITEM_RE`，中英文分节别名归一），约 40 行，**不引入任何新依赖**
- 渲染：版本时间线（版本号 + 日期），五类型分组徽章，颜色语义对齐 admin `ChangelogPage` 的 TYPE_META（新增=绿/变更=蓝/修复=橙/移除=红/安全=紫）
- 简洁顶栏（LOOM logo → 首页）+ 底部栏，内链拼 `NEXT_PUBLIC_BASE_PATH` 前缀（同 layout.tsx:5 模式）
- `metadata` title「更新日志 — Loom」
- 首页入口：`FOOTER_LINKS`「更新日志」（现为 `#` 占位）→ `${basePath}/changelog`

### 5. 登记回写（AGENTS.md 开发后必做）

- **`CHANGELOG.md`** 新增 `[0.9.0] - 2026-11-04` 节：新增（changelog 页、AI 板块）/ 变更（浅色改版、版本徽章修正）/ 移除（赞助栏）
- **`docs/ROADMAP.md`** 追加一行产物记录

## 验证

1. `pnpm build:landing`：构建通过，`apps/landing/out/changelog/index.html` 存在，产物 grep 无 `sponsor/赞助/ecosystem` 残留
2. `NEXT_PUBLIC_BASE_PATH=/loom pnpm build:landing` 再跑一次，确认子路径链接正确
3. 起 landing dev（port 3001）用浏览器截图目检：首页浅色效果、AI 板块、/changelog 渲染（9 个版本完整、分组徽章正确）
4. `pnpm --filter @loom/landing lint` 通过

不涉及提交；构建产物 push main 后由现有 `landing-pages.yml` workflow 自动发布 Pages。
