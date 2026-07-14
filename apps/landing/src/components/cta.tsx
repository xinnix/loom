export function Cta() {
  return (
    <section className="bg-brand-600 py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          准备好用 AI 加速你的全栈开发了吗？
        </h2>
        <p className="mt-4 text-lg text-brand-200">
          从克隆到上线，Loom 让 Claude Code 成为你的全职开发搭档。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="https://github.com/xinnix/loom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-600 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl"
          >
            git clone 免费开始
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
            href="#sponsor"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-400 px-8 py-3 text-sm font-medium text-white transition-colors hover:border-brand-300 hover:bg-brand-500"
          >
            请作者喝杯咖啡 ☕
          </a>
        </div>
      </div>
    </section>
  );
}
