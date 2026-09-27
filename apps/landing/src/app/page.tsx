import { CopyCommandButton } from './_components/copy-command-button';

const NAV_LINKS = [
  { label: '架构设计', href: '#architecture', active: true },
  { label: '模块组件', href: '#modules', active: false },
  { label: '指令行', href: '#cli', active: false },
  { label: '生态网络', href: '#ecosystem', active: false },
  { label: '基准对比', href: '#benchmarks', active: false },
];

const METRICS = [
  {
    no: 'METRIC // 01',
    label: '系统能力',
    value: '19',
    valueClass: 'text-text-primary',
    unit: 'SKILLS',
    unitClass: 'text-primary',
    desc: '集成化智能体技能',
  },
  {
    no: 'METRIC // 02',
    label: '接口标准',
    value: '10',
    valueClass: 'text-text-primary',
    unit: 'CMDS',
    unitClass: 'text-terminal-cyan',
    desc: '斜杠协议指令集',
  },
  {
    no: 'METRIC // 03',
    label: '自动化深度',
    value: '07',
    valueClass: 'text-text-primary',
    unit: 'HOOKS',
    unitClass: 'text-secondary-fixed',
    desc: '确定性生命周期钩子',
  },
  {
    no: 'METRIC // 04',
    label: '类型覆盖',
    value: '100%',
    valueClass: 'text-primary',
    unit: 'SYNC',
    unitClass: 'text-text-muted',
    desc: '类型安全同步率',
  },
];

const PROTOCOL_TRIGGERS = [
  {
    cmd: '/START-API',
    cmdClass: 'bg-primary/10 border-primary/20 text-primary',
    desc: '初始化 NestJS 契约及微路由总线',
    status: 'STDOUT → 0 ERRORS',
    statusClass: 'text-text-muted',
  },
  {
    cmd: '/GEN-MODULE',
    cmdClass: 'bg-terminal-cyan/10 border-terminal-cyan/20 text-terminal-cyan',
    desc: '触发 CRUD 全链路控制器、模型生成',
    status: 'SCHEMA VALIDATED',
    statusClass: 'text-text-muted',
  },
  {
    cmd: '/SYNC-SCHEMA',
    cmdClass: 'bg-secondary-fixed/10 border-secondary-fixed/20 text-secondary-fixed',
    desc: 'Zod 与 Prisma 类型跨工作区实时分发',
    status: 'MONOREPO HOT-RELOAD',
    statusClass: 'text-primary',
  },
];

const TECH_STACK = [
  {
    label: '服务层',
    name: 'NestJS',
    badge: 'API',
    badgeClass: 'text-primary',
    desc: '企业级依赖注入与模块解耦框架',
  },
  {
    label: '通讯协议',
    name: 'tRPC',
    badge: 'RPC',
    badgeClass: 'text-terminal-cyan',
    desc: '端到端完全类型安全的高效通讯',
  },
  {
    label: '持久层',
    name: 'Prisma',
    badge: 'ORM',
    badgeClass: 'text-secondary',
    desc: '自动化迁移与声明式数据模型',
  },
  {
    label: '管理后台',
    name: 'Refine',
    badge: 'ADMIN',
    badgeClass: 'text-text-primary',
    desc: '内部工具与运维面板的极速响应基座',
  },
  {
    label: '数据校验',
    name: 'Zod',
    badge: 'SCHEMA',
    badgeClass: 'text-primary',
    desc: '运行时类型校验与静态推断同构',
  },
  {
    label: '状态管理',
    name: 'TanStack',
    badge: 'STATE',
    badgeClass: 'text-terminal-cyan',
    desc: '异步数据同步与极致缓存策略',
  },
  {
    label: '基础设施',
    name: 'PostgreSQL',
    badge: 'DATABASE',
    badgeClass: 'text-secondary',
    desc: '工业级 ACID 可靠性与复杂关系建模',
  },
  {
    label: '运行环境',
    name: 'Node.js',
    badge: 'RUNTIME',
    badgeClass: 'text-text-primary',
    desc: '长期支持版本 LTS，极致高并发事件循环',
  },
];

const CLI_FEATURES = [
  {
    icon: 'bolt',
    iconClass: 'bg-primary/20 text-primary',
    title: '脚手架即开即用',
    desc: '项目骨架、数据库连接、认证系统全部预配置，克隆即开工。',
  },
  {
    icon: 'sync',
    iconClass: 'bg-terminal-cyan/20 text-terminal-cyan',
    title: '类型安全同步',
    desc: '跨整个系统表面积的自动化类型生成与校验。',
  },
];

const SPONSOR_CHANNELS = [
  {
    label: '支付向量：微信',
    dotClass: 'bg-primary',
    cardHover: 'hover:border-primary/40',
    qrHover: 'group-hover:border-primary/50',
    icon: 'qr_code_2',
    iconClass: 'text-primary',
    code: 'COMMUNITY_WECHAT',
    note: '扫描赞助开发者节点',
  },
  {
    label: '支付向量：支付宝',
    dotClass: 'bg-terminal-cyan',
    cardHover: 'hover:border-terminal-cyan/40',
    qrHover: 'group-hover:border-terminal-cyan/50',
    icon: 'qr_code_scanner',
    iconClass: 'text-terminal-cyan',
    code: 'COMMUNITY_ALIPAY',
    note: '扫描支持底层生态建设',
  },
];

const FOOTER_LINKS = [
  { label: '技术文档', href: '#' },
  { label: '系统状态', href: '#' },
  { label: '安全审计', href: '#' },
  { label: '更新日志', href: '#' },
  { label: '开源社区', href: '#ecosystem' },
];

const INSTALL_COMMAND = 'npx create-loom@latest my-app';

export default function LandingPage() {
  return (
    <>
      {/* 背景氛围层 */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),rgba(5,7,10,0))] opacity-80" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface-acrylic backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
        <div className="h-16 max-w-7xl mx-auto px-margin md:px-margin-desktop flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <a className="flex items-center gap-space-sm group" href="#">
              <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary group-hover:text-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-[18px]">polyline</span>
              </div>
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-text-primary uppercase">
                LOOM
              </span>
            </a>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-label-caps text-label-caps uppercase text-primary">v0.1</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-space-lg">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                className={
                  link.active
                    ? 'transition-colors py-1 text-primary font-bold'
                    : 'font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors py-1'
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-space-sm sm:gap-space-md">
            <a
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              href="https://github.com/xinnix/loom"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              <span className="hidden sm:inline font-label-mono text-label-mono">xinnix/loom</span>
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-surface-base font-label-caps text-label-caps text-primary">
                <span className="material-symbols-outlined text-[12px]">star</span>2.4k
              </span>
            </a>
            <a
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container text-on-primary-container hover:bg-primary font-code-snippet text-code-snippet font-bold transition-colors shadow-[0_0_16px_rgba(16,185,129,0.2)]"
              href="#cli"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              快速部署
            </a>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full pt-16 bg-transparent min-h-[calc(100vh-14rem)]">
        <div className="flex flex-col w-full">
          {/* Hero */}
          <section className="relative w-full max-w-7xl mx-auto px-margin md:px-margin-desktop pt-space-xl pb-space-3xl flex flex-col items-center text-center">
            {/* 标题背后的氛围光晕 */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 md:w-[680px] h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none -z-10" />

            {/* Agent 徽章胶囊 */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated/90 border border-border-strong backdrop-blur-md shadow-[0_0_24px_-4px_rgba(16,185,129,0.25)] mb-space-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-text-muted">
                专为
              </span>
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold">
                CLAUDE CODE
              </span>
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-text-muted">
                架构优化
              </span>
              <span className="text-text-muted/40 text-[10px]">|</span>
              <span className="font-label-mono text-label-mono text-secondary">v0.1-STABLE</span>
            </div>

            {/* 主标题 */}
            <h1 className="font-display-hero text-headline-xl md:text-display-hero text-text-primary tracking-tight max-w-4xl mx-auto leading-none font-bold">
              以智能体为中心构建应用的
              <span className="bg-gradient-to-r from-primary via-secondary-fixed to-text-primary bg-clip-text text-transparent">
                脚手架
              </span>
            </h1>

            {/* 核心哲学副标题 */}
            <p className="mt-space-lg font-body-lg text-body-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
              Loom 意为织机，将 <span className="text-text-primary">AI Agent</span>
              、后端、前端与数据库精密编织为完整的全栈开发体验。
            </p>

            {/* 架构指标标语 */}
            <div className="mt-space-md inline-flex flex-wrap items-center justify-center gap-2 font-label-mono text-label-mono text-secondary-fixed-dim bg-surface-elevated/60 px-4 py-2 rounded border border-border-subtle">
              <span>19 种模块化技能</span>
              <span className="text-primary/40">•</span>
              <span>10 种核心指令</span>
              <span className="text-primary/40">•</span>
              <span className="text-primary font-semibold">精准编织</span>
            </div>

            {/* 安装命令复制框 + 对比入口 */}
            <div className="mt-space-xl w-full max-w-xl flex flex-col sm:flex-row items-center justify-center gap-space-sm">
              <div className="w-full sm:w-auto flex-1 flex items-center justify-between px-4 py-3 bg-surface-base border border-border-strong/70 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] group">
                <div className="flex items-center gap-2 font-code-snippet text-code-snippet overflow-x-auto">
                  <span className="text-primary font-bold select-none">$</span>
                  <span className="text-text-primary">{INSTALL_COMMAND}</span>
                </div>
                <CopyCommandButton command={INSTALL_COMMAND} />
              </div>
              <a
                className="w-full sm:w-auto px-5 py-3 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-text-primary font-code-snippet text-code-snippet flex items-center justify-center gap-2 transition-colors"
                href="#benchmarks"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">
                  view_timeline
                </span>
                架构全景对比
              </a>
            </div>

            {/* 核心指标卡 */}
            <div className="mt-space-2xl w-full max-w-5xl border-t border-border-subtle/80 pt-space-lg grid grid-cols-2 md:grid-cols-4 gap-space-md">
              {METRICS.map((metric) => (
                <div
                  key={metric.no}
                  className="p-4 rounded bg-surface-elevated/40 border border-border-subtle text-left relative overflow-hidden group hover:border-primary/40 transition-colors"
                >
                  <div className="absolute top-2 right-3 font-label-caps text-label-caps text-text-muted/60 tracking-widest">
                    {metric.no}
                  </div>
                  <span className="font-label-mono text-label-mono text-text-muted block">
                    {metric.label}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span
                      className={`font-headline-xl text-headline-xl font-bold ${metric.valueClass}`}
                    >
                      {metric.value}
                    </span>
                    <span className={`font-label-caps text-label-caps ${metric.unitClass}`}>
                      {metric.unit}
                    </span>
                  </div>
                  <span className="mt-1 text-body-md text-text-muted text-[12px] block">
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 架构优化 Bento Grid */}
          <section
            className="w-full max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-2xl"
            id="architecture"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl pb-space-md border-b border-border-subtle gap-space-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-label-caps text-label-caps text-primary tracking-widest uppercase">
                  <span className="text-text-muted">[</span> 架构完整性{' '}
                  <span className="text-text-muted">]</span>
                </div>
                <h2 className="font-headline-xl text-headline-xl font-bold text-text-primary tracking-tight">
                  以智能体为核心的优化
                </h2>
              </div>
              <p className="font-body-md text-body-md text-text-muted max-w-md">
                通过标准化的系统编织，消除人类意图与机器执行之间的摩擦。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
              {/* 卡片 1：精准指令协议（大卡，7 列） */}
              <div className="md:col-span-7 bg-surface-elevated/80 border border-border-subtle rounded-lg p-space-lg flex flex-col justify-between relative overflow-hidden group hover:border-border-strong transition-colors">
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between text-text-muted font-label-mono text-label-mono">
                    <span>模块 // 01</span>
                    <span className="text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      DETERMINISTIC
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg font-semibold text-text-primary">
                    精准指令协议
                  </h3>
                  <p className="font-body-md text-body-md text-text-muted max-w-xl">
                    为 Claude Code
                    提供标准化的入口点。每条指令都是确定性的，产生的输出可供智能体解析、验证和迭代，不存在歧义。
                  </p>
                </div>
                {/* 协议触发可视化 */}
                <div className="mt-space-lg space-y-space-xs font-code-snippet text-code-snippet">
                  {PROTOCOL_TRIGGERS.map((trigger) => (
                    <div
                      key={trigger.cmd}
                      className="p-3 bg-surface-base/90 rounded border border-border-subtle/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded border font-bold whitespace-nowrap ${trigger.cmdClass}`}
                        >
                          {trigger.cmd}
                        </span>
                        <span className="text-on-surface-variant text-[12px]">{trigger.desc}</span>
                      </div>
                      <span
                        className={`font-label-caps text-label-caps sm:text-right ${trigger.statusClass}`}
                      >
                        {trigger.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 卡片 2：19 种预编译技能（5 列） */}
              <div className="md:col-span-5 bg-surface-elevated/80 border border-border-subtle rounded-lg p-space-lg flex flex-col justify-between hover:border-border-strong transition-colors">
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between text-text-muted font-label-mono text-label-mono">
                    <span>技能 // 矩阵</span>
                    <span className="font-label-caps text-label-caps text-terminal-cyan">
                      19 AGENT CAPACITIES
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg font-semibold text-text-primary">
                    19 种预编译技能
                  </h3>
                  <p className="font-body-md text-body-md text-text-muted">
                    从自动化 CRUD 生成到复杂的数据库迁移，Loom
                    提供了一系列原始技能库，在项目范围内扩展了 Claude 的核心能力。
                  </p>
                </div>
                {/* 织机网格可视化 */}
                <div className="mt-space-md p-4 bg-surface-base/70 rounded border border-border-subtle flex flex-col items-center justify-center">
                  <div className="w-full flex items-center justify-between font-label-caps text-label-caps text-text-muted mb-2">
                    <span>CLAUDE CONTEXT</span>
                    <span className="text-primary font-bold">WOVEN LATENCY: 2.1ms</span>
                  </div>
                  <svg className="w-full h-20 text-primary/40" fill="none" viewBox="0 0 300 70">
                    <line
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                      x1="10"
                      x2="290"
                      y1="35"
                      y2="35"
                    />
                    <circle className="animate-pulse" cx="50" cy="35" fill="#10B981" r="4" />
                    <circle cx="100" cy="20" fill="#38BDF8" r="3" />
                    <circle cx="150" cy="50" fill="#10B981" r="3" />
                    <circle cx="200" cy="20" fill="#38BDF8" r="3" />
                    <circle cx="250" cy="35" fill="#4edea3" r="5" />
                    <path
                      d="M 50 35 Q 100 0, 150 50 T 250 35"
                      fill="none"
                      stroke="#10B981"
                      strokeOpacity="0.8"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 50 35 Q 100 70, 200 20 T 250 35"
                      fill="none"
                      stroke="#38BDF8"
                      strokeOpacity="0.7"
                      strokeWidth="1.2"
                    />
                  </svg>
                  <div className="w-full flex justify-between font-label-mono text-label-mono text-text-muted text-[10px] mt-1">
                    <span>PROMPT_IN</span>
                    <span>PRISMA_GEN</span>
                    <span>REST_TRPC</span>
                    <span>DEPLOY_OUT</span>
                  </div>
                </div>
              </div>

              {/* 卡片 3：钩子 */}
              <div className="md:col-span-4 bg-surface-elevated/80 border border-border-subtle rounded-lg p-space-lg flex flex-col justify-between hover:border-border-strong transition-colors">
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between text-text-muted font-label-mono text-label-mono">
                    <span>钩子 // 核心</span>
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      lock_reset
                    </span>
                  </div>
                  <h4 className="font-headline-md text-headline-md font-semibold text-text-primary">
                    自动化同步机制
                  </h4>
                  <p className="font-body-md text-body-md text-text-muted">
                    Post-commit 触发器与 pre-push 验证，确保整个 Monorepo 的结构一致性与代码健壮。
                  </p>
                </div>
                <div className="mt-space-md pt-3 border-t border-border-subtle/50 flex items-center gap-2 font-label-mono text-label-mono text-text-muted">
                  <span className="text-primary font-bold">git:</span> hook:{' '}
                  <code className="text-text-primary bg-surface-container px-1.5 py-0.5 rounded">
                    loom-precheck
                  </code>
                </div>
              </div>

              {/* 卡片 4：双通道认证 */}
              <div className="md:col-span-4 bg-surface-elevated/80 border border-border-subtle rounded-lg p-space-lg flex flex-col justify-between hover:border-border-strong transition-colors">
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between text-text-muted font-label-mono text-label-mono">
                    <span>认证 // 向量</span>
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      verified_user
                    </span>
                  </div>
                  <h4 className="font-headline-md text-headline-md font-semibold text-text-primary">
                    双通道身份认证
                  </h4>
                  <p className="font-body-md text-body-md text-text-muted">
                    统一认证层架构，开箱同时支持管理端专用 JWT 令牌与面向 Web 客户端的 REST/Session
                    协议。
                  </p>
                </div>
                <div className="mt-space-md pt-3 border-t border-border-subtle/50 flex items-center justify-between font-label-mono text-label-mono">
                  <span className="text-text-muted">ADMIN: JWT</span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-muted">WEB: REST SESSION</span>
                </div>
              </div>

              {/* 卡片 5：共享 Zod Schema */}
              <div className="md:col-span-4 bg-surface-elevated/80 border border-border-subtle rounded-lg p-space-lg flex flex-col justify-between hover:border-border-strong transition-colors">
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between text-text-muted font-label-mono text-label-mono">
                    <span>数据 // 编织</span>
                    <span className="material-symbols-outlined text-terminal-cyan text-[18px]">
                      sync_alt
                    </span>
                  </div>
                  <h4 className="font-headline-md text-headline-md font-semibold text-text-primary">
                    共享 Zod Schema
                  </h4>
                  <p className="font-body-md text-body-md text-text-muted">
                    类型的单一事实来源。只需在数据层做一次定义与更新，即可无缝传播至后端
                    API、管理面板与移动端。
                  </p>
                </div>
                <div className="mt-space-md pt-3 border-t border-border-subtle/50 flex items-center gap-1.5 font-label-mono text-label-mono text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Zero-Type-Drift Architecture</span>
                </div>
              </div>
            </div>
          </section>

          {/* 原子级组件技术栈 */}
          <section
            className="w-full max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-2xl"
            id="modules"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl pb-space-md border-b border-border-subtle gap-space-sm">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-primary tracking-wider">
                  核心技术栈
                </span>
                <h2 className="mt-1 font-headline-xl text-headline-xl font-bold text-text-primary">
                  原子级组件
                </h2>
              </div>
              <p className="font-body-md text-body-md text-text-muted max-w-md">
                每一层都因其确定性的特质和大规模下的卓越性能而被选中。
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-space-md">
              {TECH_STACK.map((tech) => (
                <div
                  key={tech.name}
                  className="p-space-md bg-surface-elevated/50 border border-border-subtle rounded hover:border-primary/50 transition-colors"
                >
                  <span className="font-label-mono text-label-mono text-text-muted block uppercase">
                    {tech.label}
                  </span>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-headline-md text-headline-md font-bold text-text-primary">
                      {tech.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-label-caps ${tech.badgeClass}`}
                    >
                      {tech.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-text-muted text-[12px] font-body-md">{tech.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 性能基准对比 */}
          <section
            className="w-full max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-2xl"
            id="benchmarks"
          >
            <div className="text-center max-w-2xl mx-auto mb-space-xl">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
                性能基准对比
              </span>
              <h2 className="mt-2 font-headline-xl text-headline-xl font-bold text-text-primary">
                Weaving 编织 vs. Scaffolding 脚手架
              </h2>
              <p className="mt-2 font-body-md text-body-md text-text-muted">
                传统单体脚手架与 Loom 确定性织机引擎的范式迁移。
              </p>
            </div>
            <div className="w-full overflow-x-auto bg-surface-elevated/90 border border-border-subtle rounded-lg shadow-xl">
              <table className="w-full text-left border-collapse font-body-md text-body-md">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-container-low font-label-mono text-label-mono text-text-muted uppercase">
                    <th className="py-4 px-6 font-semibold w-1/4">评估参数</th>
                    <th className="py-4 px-6 font-semibold w-5/12">传统模板 (Traditional)</th>
                    <th className="py-4 px-6 font-semibold w-5/12 text-primary bg-primary/5">
                      LOOM 确定性架构 (Deterministic)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/40">
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-text-primary font-code-snippet">
                      系统感知能力
                    </td>
                    <td className="py-4 px-6 text-text-muted">
                      静态文件结构；对 AI 缺乏上下文感知。
                    </td>
                    <td className="py-4 px-6 text-text-primary bg-primary/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          check_circle
                        </span>
                        <span>智能体原生架构；从零时刻起即具备上下文深度。</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-text-primary font-code-snippet">
                      维护循环
                    </td>
                    <td className="py-4 px-6 text-text-muted">需手动编写重复的 CRUD 逻辑层。</td>
                    <td className="py-4 px-6 text-text-primary bg-primary/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          check_circle
                        </span>
                        <span>
                          通过{' '}
                          <code className="text-primary font-mono text-[12px] bg-surface-base px-1.5 py-0.5 rounded">
                            /GEN-MODULE
                          </code>{' '}
                          协议进行算法级自动生成。
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-text-primary font-code-snippet">
                      类型安全性
                    </td>
                    <td className="py-4 px-6 text-text-muted">
                      跨端点的手动接口映射，极易发生类型偏航。
                    </td>
                    <td className="py-4 px-6 text-text-primary bg-primary/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          check_circle
                        </span>
                        <span>全端 Zod 编织。确定性同步，100% 编译期捕获错误。</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-text-primary font-code-snippet">
                      认证体系
                    </td>
                    <td className="py-4 px-6 text-text-muted">
                      需自行集成 passport、session 等割裂方案。
                    </td>
                    <td className="py-4 px-6 text-text-primary bg-primary/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          check_circle
                        </span>
                        <span>双通道认证：Admin JWT + Web REST 开箱即用。</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* CLI 协议与终端窗口 */}
          <section
            className="w-full max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-2xl"
            id="cli"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center bg-surface-elevated/40 border border-border-subtle rounded-xl p-space-lg md:p-space-2xl">
              {/* 左侧说明 */}
              <div className="lg:col-span-5 space-y-space-md">
                <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">
                  命令行界面
                </span>
                <h2 className="font-headline-xl text-headline-xl font-bold text-text-primary">
                  快速部署协议
                </h2>
                <p className="font-body-md text-body-md text-text-muted">
                  一行 npx
                  命令即可初始化完整的全栈项目。自动配置数据库、认证系统、文件存储和支付接口。
                </p>
                <div className="space-y-space-sm pt-space-xs">
                  {CLI_FEATURES.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 ${feature.iconClass}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {feature.icon}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-body-lg text-body-lg font-semibold text-text-primary">
                          {feature.title}
                        </h4>
                        <p className="font-body-md text-body-md text-text-muted">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧模拟终端 */}
              <div className="lg:col-span-7 bg-surface-base border border-border-strong/80 rounded-lg shadow-2xl overflow-hidden font-code-snippet text-code-snippet">
                <div className="px-4 py-2.5 bg-surface-container flex items-center justify-between border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-error/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-primary/80" />
                  </div>
                  <span className="font-label-mono text-label-mono text-text-muted">
                    LOOM-CORE // BASH
                  </span>
                  <div className="w-8" />
                </div>
                <div className="p-space-lg space-y-3 font-code-snippet">
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted select-none">01</span>
                    <span className="text-primary select-none">$</span>
                    <span className="text-text-primary font-bold">{INSTALL_COMMAND}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted select-none">02</span>
                    <span className="text-primary select-none">$</span>
                    <span className="text-text-primary">cd my-app &amp;&amp; pnpm install</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted select-none">03</span>
                    <span className="text-primary select-none">$</span>
                    <span className="text-text-primary">pnpm run dev</span>
                  </div>
                  <div className="my-3 border-t border-border-subtle/50" />
                  <div className="space-y-1 text-[12px] text-text-muted">
                    <p className="text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">done</span>
                      <span>[系统] 项目脚手架生成完成。</span>
                    </p>
                    <p className="text-text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        lan
                      </span>
                      <span>[系统] API:3000 | Admin:5173 | Web:3002 | Landing:3001</span>
                    </p>
                    <p className="text-text-muted/60 pl-5">
                      {'>'} Claude Code Context Loaded: 19 modular skills ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 开源生态与赞助 */}
          <section
            className="w-full max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-2xl text-center"
            id="ecosystem"
          >
            <div className="max-w-xl mx-auto space-y-2 mb-space-xl">
              <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">
                开源生态网络
              </span>
              <h2 className="font-headline-xl text-headline-xl font-bold text-text-primary">
                维护愿景
              </h2>
              <p className="font-body-md text-body-md text-text-muted">
                Loom 由社区共同维系。支持确定性智能体核心框架的持续开发。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-lg max-w-2xl mx-auto">
              {SPONSOR_CHANNELS.map((channel) => (
                <div
                  key={channel.code}
                  className={`p-space-lg bg-surface-elevated/60 border border-border-subtle rounded-lg flex flex-col items-center transition-colors group ${channel.cardHover}`}
                >
                  <div className="flex items-center gap-2 font-label-mono text-label-mono text-text-muted mb-4">
                    <span className={`w-2 h-2 rounded-full ${channel.dotClass}`} />
                    <span>{channel.label}</span>
                  </div>
                  <div
                    className={`w-44 h-44 bg-surface-base border border-border-subtle rounded flex flex-col items-center justify-center p-3 relative transition-colors ${channel.qrHover}`}
                  >
                    <div className="w-full h-full border border-dashed border-border-subtle/80 flex flex-col items-center justify-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[36px] ${channel.iconClass}`}
                      >
                        {channel.icon}
                      </span>
                      <span className="font-label-caps text-label-caps text-text-muted">
                        {channel.code}
                      </span>
                    </div>
                  </div>
                  <span className="mt-4 font-label-mono text-label-mono text-text-muted text-[11px]">
                    {channel.note}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-surface-container-lowest mt-space-3xl">
        <div className="max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-xl pb-space-xl">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="w-6 h-6 rounded bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[15px]">polyline</span>
                </div>
                <span className="font-headline-md text-headline-md font-bold tracking-tight text-text-primary uppercase">
                  LOOM
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-caps text-label-caps text-text-muted uppercase">
                  ARCH-CORE
                </span>
              </div>
              <p className="font-body-md text-body-md text-text-muted">
                © {new Date().getFullYear()} Loom Framework. 为自主智能体提供精准编织。
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-x-space-lg gap-y-space-sm">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-code-snippet text-code-snippet text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-text-muted font-label-mono text-label-mono">
            <div className="flex items-center gap-space-sm">
              <span>TELEMETRY: OPTIMAL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>CLUSTER: PRODUCTION-NODE-01</span>
            </div>
            <div className="font-label-caps text-label-caps uppercase">
              DETERMINISTIC AGENT ORCHESTRATION ENGINE
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
