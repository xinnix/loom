const comparisons = [
  {
    dimension: '基础设施定位',
    traditional: '静态文件模板，clone 后你自己构建一切',
    loom: '围绕 AI Agent 工作流设计的开发基础设施，Agent 从第一天就理解项目',
  },
  {
    dimension: 'AI 集成深度',
    traditional: '无，最多加一个 .cursorrules 文件',
    loom: '19 个 Skill + 10 个命令 + 7 个 Hook，全生命周期 AI 辅助',
  },
  {
    dimension: 'CRUD 开发',
    traditional: '手写 Controller、Service、路由、表单、表格、分页……每一层都重写',
    loom: '/genModule 一键生成全套代码，Agent 分析 Schema 推断字段类型和关联',
  },
  {
    dimension: '类型安全',
    traditional: '前后端手动维护 API 文档，类型不同步',
    loom: 'tRPC + Prisma + Zod 全链路强类型，Schema 变则全栈自动更新',
  },
  {
    dimension: '数据库工作流',
    traditional: '手动写迁移，忘了就改 schema 直接 push',
    loom: 'Schema → agent 自动 migrate dev → generate client → build shared，预提交验证',
  },
  {
    dimension: '认证系统',
    traditional: '自己集成 passport.js、session、JWT……',
    loom: 'Admin JWT + User REST + 微信登录 + RBAC 开箱即用',
  },
  {
    dimension: '代码规范',
    traditional: '没有，或者写在 README 里积灰',
    loom: 'CLAUD.md + Agent 指令内置，Agent 生成的代码天然遵循项目模式',
  },
  {
    dimension: '多端支持',
    traditional: '通常只生成一个端，其他端要自己建项目',
    loom: 'API / Admin / Web / Landing / Miniapp 五端 Monorepo 共享类型',
  },
];

export function Comparison() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-600">
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent-500" />
            差距一目了然
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            与传统脚手架的根本区别
          </h2>
          <p className="mt-3 text-base leading-relaxed text-neutral-500">
            Loom 不是把同样的东西换了个颜色 — 而是从底层重新思考了 AI 时代的开发工具应该是什么样子
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-neutral-200">
          {/* Table header */}
          <div className="hidden grid-cols-12 gap-0 bg-neutral-50 md:grid">
            <div className="col-span-3 border-b border-r border-neutral-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              对比维度
            </div>
            <div className="col-span-4 border-b border-neutral-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              传统脚手架
            </div>
            <div className="col-span-5 border-b border-brand-100 bg-brand-50/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-600">
              Loom Agent-Centric
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((c, i) => (
            <div
              key={c.dimension}
              className={`grid grid-cols-12 gap-0 ${
                i < comparisons.length - 1 ? 'border-b border-neutral-100' : ''
              }`}
            >
              {/* Dimension label (sticky label on mobile) */}
              <div className="col-span-12 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-700 md:col-span-3 md:border-b-0 md:border-r md:border-neutral-200 md:bg-transparent md:py-4 md:text-sm">
                {c.dimension}
              </div>

              {/* Traditional */}
              <div className="col-span-6 border-r border-neutral-100 px-4 py-2.5 md:col-span-4 md:py-4">
                <span className="text-xs text-neutral-400 md:text-sm">
                  <span className="inline-block md:hidden">❌ </span>
                  {c.traditional}
                </span>
              </div>

              {/* Loom */}
              <div className="col-span-6 bg-brand-50/30 px-4 py-2.5 md:col-span-5 md:bg-transparent md:py-4">
                <span className="text-xs font-medium text-brand-700 md:text-sm">
                  <span className="inline-block md:hidden">✅ </span>
                  {c.loom}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
