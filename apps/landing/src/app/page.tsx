export default function LandingPage() {
  return (
    <>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-gutter max-w-container-max mx-auto h-20">
          <div className="flex items-center gap-12">
            <a
              className="font-headline-md text-2xl tracking-tighter text-on-surface flex items-center gap-3"
              href="#"
            >
              <svg className="text-primary" fill="none" height="24" viewBox="0 0 24 24" width="24">
                <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 12H20" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1" />
                <path d="M12 4V20" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1" />
              </svg>
              LOOM
            </a>
            <nav className="hidden md:flex items-center gap-8">
              <a className="mono-label hover:text-primary transition-colors" href="#features">
                架构设计
              </a>
              <a className="mono-label hover:text-primary transition-colors" href="#tech">
                模块组件
              </a>
              <a className="mono-label hover:text-primary transition-colors" href="#terminal">
                命令行
              </a>
              <a className="mono-label hover:text-primary transition-colors" href="#ecosystem">
                网络生态
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <span className="mono-label hidden sm:block">v0.1</span>
            <div className="w-px h-6 bg-slate-200" />
            <a
              className="text-on-surface hover:text-primary transition-colors"
              href="https://github.com/xinnix/loom"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="relative min-h-[90vh] flex items-center justify-center py-section-gap-lg blueprint-grid border-b border-slate-200">
          <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter text-center">
            <div className="inline-flex items-center gap-3 mb-10">
              <div className="h-px w-8 bg-slate-300" />
              <span className="mono-label text-primary">专为 Claude Code 架构优化</span>
              <div className="h-px w-8 bg-slate-300" />
            </div>

            <h1 className="font-display-hero text-4xl md:text-5xl lg:text-6xl text-on-surface mb-8 max-w-5xl mx-auto leading-tight tracking-tight">
              以智能体为中心构建应用的脚手架
            </h1>

            <p className="font-headline-md text-lg md:text-xl text-secondary max-w-3xl mx-auto mb-8 leading-relaxed">
              Loom 意为织机，将 AI Agent、后端、前端与数据库精密编织为完整的全栈开发体验
            </p>

            <p className="font-body-lg text-secondary max-w-2xl mx-auto mb-0">
              <span className="text-on-surface font-medium">
                19 种模块化技能 • 10 种核心指令 • 精准编织
              </span>
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 border-b border-slate-200 bg-white">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-0 divide-x-0 md:divide-x divide-slate-100">
              {[
                { label: '系统能力', value: '19', desc: '集成化智能体技能' },
                { label: '接口标准', value: '10', desc: '斜杠协议指令集' },
                { label: '自动化深度', value: '07', desc: '确定性生命周期钩子' },
                { label: '类型覆盖', value: '100%', desc: '类型安全同步率' },
              ].map((s) => (
                <div key={s.label} className="px-8 text-center md:text-left">
                  <div className="mono-label mb-2">{s.label}</div>
                  <div className="font-headline-md text-4xl text-on-surface">{s.value}</div>
                  <p className="text-[11px] text-slate-400 mt-2 uppercase tracking-tighter">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-section-gap-lg" id="features">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-xl">
                <div className="mono-label text-primary mb-4">[ 架构完整性 ]</div>
                <h2 className="font-headline-lg text-on-surface">以智能体为核心的优化</h2>
              </div>
              <p className="text-secondary max-w-sm font-body-md">
                通过标准化的系统编织，消除人类意图与机器执行之间的摩擦。
              </p>
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* Large featured block */}
              <div className="col-span-12 lg:col-span-8 tech-border p-10 bg-slate-50 flex flex-col justify-between min-h-[400px]">
                <div>
                  <div className="mono-label mb-6">模块 // 01</div>
                  <h3 className="font-headline-md text-3xl mb-4">精准指令协议</h3>
                  <p className="text-secondary max-w-lg mb-8">
                    为 Claude Code
                    提供标准化的入口点。每条指令都是确定性的，产生的输出可供智能体解析、验证和迭代，不存在歧义。
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 font-label-mono text-[11px]">
                  <div className="px-4 py-2 border border-slate-200 bg-white">/START-API</div>
                  <div className="px-4 py-2 border border-slate-200 bg-white">/GEN-MODULE</div>
                  <div className="px-4 py-2 border border-slate-200 bg-white">/SYNC-SCHEMA</div>
                </div>
              </div>

              {/* Vertical block */}
              <div className="col-span-12 lg:col-span-4 tech-border p-10 flex flex-col justify-center border-l-4 border-l-primary/20">
                <div className="mono-label mb-6">技能 // 矩阵</div>
                <h3 className="font-headline-md text-2xl mb-4">19 种预编译技能</h3>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  从自动化 CRUD 生成到复杂的数据库迁移，Loom
                  提供了一系列原始技能库，在项目范围内扩展了 Claude 的核心能力。
                </p>
                <svg className="w-full h-24 opacity-30" viewBox="0 0 200 60">
                  <path
                    d="M0 30H200M40 0V60M80 0V60M120 0V60M160 0V60"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                  <circle cx="80" cy="30" fill="currentColor" r="4" />
                </svg>
              </div>

              {/* Three smaller blocks */}
              {[
                {
                  mono: '钩子 // 核心',
                  title: '自动化同步机制',
                  desc: 'Post-commit 触发器与 pre-push 验证，确保整个 Monorepo 的结构一致性。',
                },
                {
                  mono: '认证 // 向量',
                  title: '双通道身份认证',
                  desc: '统一认证层，同时支持管理端 JWT 与面向 Web 的 REST 协议。',
                },
                {
                  mono: '数据 // 编织',
                  title: '共享 Zod Schema',
                  desc: '类型的单一事实来源。一次更新，即刻传播至 API、管理端与客户端。',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="col-span-12 md:col-span-4 tech-border p-8 hover:bg-slate-50 transition-colors group"
                >
                  <div className="mono-label mb-4 group-hover:text-primary transition-colors">
                    {f.mono}
                  </div>
                  <h4 className="font-bold mb-2">{f.title}</h4>
                  <p className="text-xs text-secondary">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-24 bg-slate-50 border-y border-slate-200" id="tech">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <div className="grid lg:grid-cols-4 gap-12">
              <div className="lg:col-span-1 border-r border-slate-200 pr-8">
                <div className="mono-label text-primary mb-4">核心技术栈</div>
                <h2 className="font-headline-md text-3xl mb-6">原子级组件</h2>
                <p className="text-secondary text-sm">
                  每一层都因其确定性的特质和大规模下的卓越性能而被选中。
                </p>
              </div>
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200">
                {[
                  { name: 'NestJS', label: '服务层' },
                  { name: 'tRPC', label: '通讯协议' },
                  { name: 'Prisma', label: '持久层' },
                  { name: 'Refine', label: '管理后台' },
                  { name: 'Zod', label: '数据校验' },
                  { name: 'TanStack', label: '状态管理' },
                  { name: 'PostgreSQL', label: '基础设施' },
                  { name: 'Node.js', label: '运行环境' },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="bg-white p-8 flex flex-col items-center justify-center text-center group"
                  >
                    <span className="mono-label text-[9px] mb-2">{t.label}</span>
                    <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
                      {t.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-section-gap-lg">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <div className="text-center mb-16">
              <div className="mono-label mb-4">性能基准对比</div>
              <h2 className="font-headline-lg">Weaving 编织 vs. Scaffolding 脚手架</h2>
            </div>
            <div className="tech-border overflow-hidden">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-6 mono-label border-r border-slate-200">评估参数</th>
                    <th className="p-6 mono-label border-r border-slate-200">传统模板</th>
                    <th className="p-6 mono-label text-primary">Loom 确定性架构</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-body-md">
                  {[
                    {
                      dim: '系统感知能力',
                      legacy: '静态文件结构；对 AI 缺乏上下文感知。',
                      loom: '智能体原生架构；从零时刻起即具备上下文深度。',
                    },
                    {
                      dim: '维护循环',
                      legacy: '需手动编写重复的 CRUD 逻辑层。',
                      loom: '通过 /GEN-MODULE 协议进行算法级自动生成。',
                    },
                    {
                      dim: '类型安全性',
                      legacy: '跨端点的手动接口映射。',
                      loom: '全端 Zod 编织。确定性同步。',
                    },
                    {
                      dim: '认证体系',
                      legacy: '需自行集成 passport、session 等。',
                      loom: '双通道认证：Admin JWT + Web REST 开箱即用。',
                    },
                  ].map((row) => (
                    <tr key={row.dim}>
                      <td className="p-6 border-r border-slate-200 font-bold text-sm">{row.dim}</td>
                      <td className="p-6 border-r border-slate-200 text-xs text-secondary">
                        {row.legacy}
                      </td>
                      <td className="p-6 text-sm bg-primary/5 border-l border-primary/20">
                        {row.loom}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CLI Terminal */}
        <section
          className="py-section-gap-lg bg-slate-900 text-white relative overflow-hidden"
          id="terminal"
        >
          <div className="absolute inset-0 blueprint-grid opacity-10 pointer-events-none" />
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <div className="mono-label text-primary/80 mb-4">命令行界面</div>
                <h2 className="font-headline-md text-3xl mb-8">快速部署协议</h2>
                <p className="text-slate-400 font-body-lg mb-10">
                  一行 npx
                  命令即可初始化完整的全栈项目。自动配置数据库、认证系统、文件存储和支付接口。
                </p>
                <div className="space-y-6">
                  {[
                    {
                      title: '脚手架即开即用',
                      desc: '项目骨架、数据库连接、认证系统全部预配置，克隆即开工。',
                    },
                    { title: '类型安全同步', desc: '跨整个系统表面积的自动化类型生成与校验。' },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <div>
                        <div className="font-bold text-slate-100">{item.title}</div>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminal */}
              <div className="bg-[#020617] border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
                <div className="bg-slate-800/50 px-5 py-3 flex justify-between items-center border-b border-slate-700">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  </div>
                  <span className="mono-label text-[9px] text-slate-400">LOOM-CORE // BASH</span>
                </div>
                <div className="p-10 font-label-mono text-sm space-y-6 text-slate-300">
                  <div className="flex gap-4">
                    <span className="text-primary opacity-60">01</span>
                    <span>npx create-loom@latest my-app</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary opacity-60">02</span>
                    <span>cd my-app &amp;&amp; pnpm install</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary opacity-60">03</span>
                    <span>pnpm run dev</span>
                  </div>
                  <div className="pt-6 border-t border-slate-800 text-slate-500 italic text-xs">
                    [系统] 项目脚手架生成完成。
                    <br />
                    [系统] API:3000 Admin:5173 Web:3002 Landing:3001
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsor */}
        <section className="py-section-gap-lg" id="ecosystem">
          <div className="max-w-3xl mx-auto px-margin-mobile text-center">
            <div className="mono-label text-slate-400 mb-6">开源生态网络</div>
            <h2 className="font-headline-md text-3xl mb-8">维护愿景</h2>
            <p className="text-secondary mb-16 max-w-xl mx-auto">
              Loom 由社区共同维系。支持确定性智能体核心框架的持续开发。
            </p>
            <div className="grid sm:grid-cols-2 gap-px bg-slate-200 border border-slate-200 shadow-sm">
              <div className="bg-white p-12 text-center group hover:bg-slate-50 transition-all">
                <div className="mono-label mb-8 group-hover:text-primary">支付向量：微信</div>
                <div className="w-40 h-40 mx-auto bg-white border border-slate-100 flex items-center justify-center tech-border">
                  <svg
                    className="w-20 h-20 text-slate-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect height="18" rx="1" width="18" x="3" y="3" />
                    <path d="M7 7h2v2H7zM15 7h2v2h-2zM7 15h2v2H7zM15 15h2v2h-2z" />
                  </svg>
                </div>
              </div>
              <div className="bg-white p-12 text-center group hover:bg-slate-50 transition-all">
                <div className="mono-label mb-8 group-hover:text-primary">支付向量：支付宝</div>
                <div className="w-40 h-40 mx-auto bg-white border border-slate-100 flex items-center justify-center tech-border">
                  <svg
                    className="w-20 h-20 text-slate-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect height="18" rx="1" width="18" x="3" y="3" />
                    <path d="M7 7h2v2H7zM15 7h2v2h-2zM7 15h2v2H7zM15 15h2v2h-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-gutter max-w-container-max mx-auto gap-12">
          <div className="space-y-4">
            <div className="font-headline-md text-xl text-on-surface flex items-center gap-2">
              <svg className="text-primary" fill="none" height="18" viewBox="0 0 24 24" width="18">
                <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" />
              </svg>
              LOOM
            </div>
            <p className="mono-label text-[9px]">
              &copy; {new Date().getFullYear()} Loom Framework. 为自主智能体提供精准编织。
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-10">
            <a className="mono-label hover:text-primary transition-colors" href="#">
              技术文档
            </a>
            <a className="mono-label hover:text-primary transition-colors" href="#">
              系统状态
            </a>
            <a className="mono-label hover:text-primary transition-colors" href="#">
              安全审计
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
