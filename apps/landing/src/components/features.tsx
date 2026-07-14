const agentFeatures = [
  {
    icon: '⚡',
    title: '19 个内置 Skill',
    desc: '从 genModule 一键生成 CRUD，到 db-migrate 管理数据库迁移，到 ship 分批提交代码。每个 Skill 是精心编排的 Agent 工作流，不是一堆提示词。',
    links: ['genModule', 'db-migrate', 'ship', 'validate', 'seed-data', 'enum-sync'],
  },
  {
    icon: '⌘',
    title: '10 个 Slash 命令',
    desc: 'start-api、start-admin、build-all、type-check… 覆盖开发全周期的快捷入口。不再需要翻文档找命令——Chtrl+/ 即刻执行。',
    links: ['start-api', 'start-admin', '/build-all', '/type-check'],
  },
  {
    icon: '⚙',
    title: '7 个自动化 Hook',
    desc: 'Schema 变更后自动 db-migrate、代码提交通道 pre-commit typecheck、git pull 后 auto sync 工作区、构建前 lint — Agent 在后台主动为你工作。',
    links: ['pre-commit 类型检查', 'post-pull 同步', '构建前验证', 'Schema 触发迁移'],
  },
  {
    icon: '🧠',
    title: 'Scaffold 抽象层',
    desc: 'BaseService、StandardListPage、StandardForm、StandardDetailPage — 4 个核心抽象覆盖 80% 的 CRUD 场景。Agent 生成的代码天然遵循这些模式。',
    links: ['BaseService', 'StandardListPage', 'StandardForm', 'StandardDetailPage'],
  },
  {
    icon: '🔐',
    title: '双用户认证系统',
    desc: 'Admin JWT + Web User REST 两套独立认证流，内置邮箱注册、微信登录，RBAC 角色权限控制。覆盖管理后台和用户端所有场景。',
    links: ['Admin JWT', '微信登录', '邮箱注册', 'RBAC'],
  },
  {
    icon: '📦',
    title: '五端一体 Monorepo',
    desc: 'API / Admin / Web / Landing / Miniapp 共享同一套 @loom/shared 类型和 Zod 验证。改一个 Schema，五端自动感知，零手动同步。',
    links: [
      'API (NestJS)',
      'Admin (Refine)',
      'Web (Next.js)',
      'Landing (SSG)',
      'Miniapp (uni-app)',
    ],
  },
  {
    icon: '🎯',
    title: '一键 CRUD 生成',
    desc: '输入 /genModule Product，Agent 自动分析 Prisma Schema、推导字段类型、检测关联关系、生成本地化 i18n 文案 — 全套 Service / Router / Page 一步到位。',
    links: ['字段类型推断', '关系检测', '多语言生成', '标准模板'],
  },
  {
    icon: '🔌',
    title: '文件上传 & 支付',
    desc: '多策略文件存储（本地/OSS）、微信支付 JSAPI + 退款、Sequelize-like query。不依赖第三方 SaaS，clone 下来就带着。',
    links: ['文件存储', '微信支付', '退款', '数据查询'],
  },
];

const techStack = [
  {
    component: 'NestJS',
    desc: '模块化后端、依赖注入、中间件生态，支撑复杂业务逻辑',
    href: 'https://nestjs.com',
  },
  {
    component: 'tRPC',
    desc: '端到端类型安全，从前端直接调用后端类型，零 API 文档断层',
    href: 'https://trpc.io',
  },
  {
    component: 'Prisma',
    desc: '唯一模型真理源，迁移即类型生成，Zod Schema 自动对齐',
    href: 'https://prisma.io',
  },
  {
    component: 'React + Refine',
    desc: 'Admin 后台基于 Refine 框架，Ant Design 组件，申明式页面配置',
    href: 'https://refine.dev',
  },
];

export function Features() {
  return (
    <>
      {/* Agent-Centric Features */}
      <section id="features" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section header */}
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-500" />
              Agent-Centric 深度优化
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              为 Claude Code 重新思考脚手架
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-500">
              传统脚手架给你一堆文件就走人。Loom 给 Claude Code 一整套理解、操作和维护项目的
              基础设施——每一个 Skill、命令、钩子都是 Agent 与项目交互的接口。
            </p>
          </div>

          {/* Feature grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {agentFeatures.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-lg">
                  {f.icon}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{f.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.links.map((l) => (
                    <span
                      key={l}
                      className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 group-hover:bg-brand-50 group-hover:text-brand-600"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              坚实的技术底座
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-500">
              全栈 TypeScript，现代技术栈，面向 AI Agent 优化
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {techStack.map((t) => (
              <a
                key={t.component}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-base font-bold text-brand-600">
                  {t.component[0]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{t.component}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
