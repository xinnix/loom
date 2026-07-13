export function Cta() {
  return (
    <section className="bg-brand-600 py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          准备好上线你的下一个 SaaS 了吗？
        </h2>
        <p className="mt-4 text-lg text-brand-200">
          立即使用 Roundtable Scaffold，从克隆到部署只需数小时。
        </p>
        <a
          href="#"
          className="mt-8 inline-flex items-center rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-600 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl"
        >
          免费开始
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
