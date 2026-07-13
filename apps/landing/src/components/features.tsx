const features = [
  {
    title: '端到端类型安全',
    desc: 'tRPC + Zod 全链路强类型，从数据库到前端零手动同步。修改 Schema，Agent 自动触发迁移与类型重建。',
  },
  {
    title: 'Auth & RBAC',
    desc: '双用户认证体系（Admin + User），JWT + 角色权限控制。微信登录、邮箱注册开箱即用。',
  },
  {
    title: 'Agent-Centric 开发',
    desc: '19 个内置 Skill、10 个 Command、7 个自动化 Hook — Claude Code 从聊天助手进化为全职开发搭档。',
  },
  {
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

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
