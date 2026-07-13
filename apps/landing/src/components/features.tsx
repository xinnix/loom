const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
    title: '端到端类型安全',
    desc: 'tRPC + Zod 全链路强类型，从数据库到前端零手动同步。修改 Schema，Agent 自动触发迁移与类型重建。',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0112 2.25c-2.012 0-3.894.547-5.519 1.5M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    ),
    title: 'Auth & RBAC',
    desc: '双用户认证体系（Admin + User），JWT + 角色权限控制。微信登录、邮箱注册开箱即用。',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16.5 3a4.5 4.5 0 014.5 4.5"
        />
      </svg>
    ),
    title: 'Admin 后台',
    desc: 'Refine + Ant Design 管理后台，StandardListPage / StandardForm 配置驱动。Agent 自动生成 CRUD 页面。',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.25 8.25l9.75 4.5 9.75-4.5M2.25 12l9.75 4.5 9.75-4.5M2.25 15.75l9.75 4.5 9.75-4.5"
        />
      </svg>
    ),
    title: '支付集成',
    desc: '微信支付 JSAPI + 退款流程，对接即用。支付模块与订单系统无缝集成，无需从零搭建。',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20.25 6.25l-7.5 7.5-3-3m0 0l-3 3 3 3m0-3l7.5-7.5M3.75 21h16.5"
        />
      </svg>
    ),
    title: 'SSOT 数据层',
    desc: 'Prisma Schema 是唯一真理源。Schema 变更 → Hook 自动提示 → Agent 执行迁移 → 类型自动同步至全端。',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3.75 6h16.5M3.75 12h16.5m-16.5 6h16.5"
        />
      </svg>
    ),
    title: '五端一体',
    desc: 'API / Admin / Web / Landing / Miniapp 一套代码五端覆盖。Monorepo 共享类型，多端并行开发。',
  },
];

export function Features() {
  return (
    <section id="features" className="bg-neutral-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            坚实的技术底座
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            全栈 TypeScript，NestJS + React + tRPC + Prisma 的现代技术栈
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
