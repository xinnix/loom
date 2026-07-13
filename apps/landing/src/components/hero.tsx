export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-white pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-gradient-to-tr from-accent-400 to-accent-600 opacity-10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-violet-300 to-brand-400 opacity-10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <span className="flex h-1.5 w-1.5 rounded-full bg-brand-500" />
            Agent-Centric 全栈开发框架
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            <span className="text-brand-600">AI Agent</span> 驱动的
            <br />
            全栈开发底座
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">
            不止是脚手架。
            <strong className="font-semibold text-neutral-800">19 个内置 Skill</strong>、
            <strong className="font-semibold text-neutral-800">10 个 Command</strong>、
            <strong className="font-semibold text-neutral-800">7 个自动化 Hook</strong> — 一套为{' '}
            <span className="text-brand-600 underline decoration-brand-300 underline-offset-2">
              Claude Code
            </span>{' '}
            量身定制的 Agent Harness，让 AI 从"聊天助手"进化为"全职开发搭档"。
            <br />
            克隆即开工，数天上线 SaaS。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#harness"
              className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30"
            >
              探索 Agent Harness
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <a
              href="#features"
              className="inline-flex items-center rounded-lg border-2 border-brand-600 px-6 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              框架特性
            </a>
            <a
              href="https://github.com/xinnix/loom"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.005-3.363-1.348-3.363-1.348-.454-1.152-1.11-1.458-1.11-1.458-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.656 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-.596 2.75-1.026 2.75-1.026.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub Star
            </a>
          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <span className="text-2xl font-bold text-neutral-900">19</span>
              <span className="ml-1.5 text-sm text-neutral-500">内置 Skill</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-neutral-900">10</span>
              <span className="ml-1.5 text-sm text-neutral-500">Command</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-neutral-900">7</span>
              <span className="ml-1.5 text-sm text-neutral-500">自动化 Hook</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-neutral-900">3</span>
              <span className="ml-1.5 text-sm text-neutral-500">专业 Agent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
