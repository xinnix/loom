export function Quickstart() {
  return (
    <section className="bg-neutral-950 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: text */}
          <div>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-800 bg-brand-950/60 px-3 py-1 text-xs font-medium text-brand-300">
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-400" />
              开箱即用
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              从零到开发，只需三行
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-400">
              Loom 预配置了数据库连接、认证系统、文件存储和支付接口。
              克隆完成后，所有基础服务开箱即用，无需手动配置第三方服务。
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'PostgreSQL + Prisma 预配置，migrate 一步到位',
                'Admin 后台登录即用，RBAC 权限初始化完成',
                '微信登录和支付配置自己的密钥即可启用',
                '19 个 Agent Skill 立即可用，无需额外安装',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-400">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com/xinnix/loom"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-500 hover:shadow-xl"
            >
              在 GitHub 上查看
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>

          {/* Right: terminal */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-neutral-500">终端</span>
            </div>
            {/* Terminal body */}
            <div className="space-y-3 px-5 py-5 font-mono text-xs leading-relaxed sm:text-sm">
              <div className="flex gap-2">
                <span className="text-green-400">$</span>
                <span className="text-neutral-300">
                  git clone https://github.com/xinnix/loom.git
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-400">$</span>
                <span className="text-neutral-300">cd loom && pnpm install</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-400">$</span>
                <span className="text-neutral-100 font-semibold">pnpm run dev</span>
              </div>

              {/* Spacer */}
              <div className="py-1" />

              {/* Output */}
              <div className="flex gap-2 opacity-80">
                <span className="text-neutral-600">&gt;</span>
                <span className="text-neutral-400">➜ API: http://localhost:3000</span>
              </div>
              <div className="flex gap-2 opacity-80">
                <span className="text-neutral-600">&gt;</span>
                <span className="text-neutral-400">➜ Admin: http://localhost:5173</span>
              </div>
              <div className="flex gap-2 opacity-60">
                <span className="text-neutral-600">&gt;</span>
                <span className="text-neutral-400">➜ Landing: http://localhost:3001</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
