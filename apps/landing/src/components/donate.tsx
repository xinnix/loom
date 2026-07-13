export function Donate() {
  return (
    <section id="donate" className="bg-gradient-to-b from-white to-brand-50 py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Coffee icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
        </div>

        <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          用爱发电 · 请我喝杯咖啡 ☕
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500">
          OpenCode Scaffold 是一个开源项目，由个人开发者利用业余时间维护。
          <br />
          如果这个项目帮到了你，不妨请我喝杯咖啡，支持持续更新！
        </p>

        {/* Payment options */}
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          {/* WeChat Pay */}
          <div className="w-48 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045.246.246 0 00.242-.245c0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 01.178-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.18 3.054c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
              </svg>
            </div>
            <p className="mt-2 text-center text-xs font-medium text-neutral-600">微信支付</p>
            <div className="mt-2 flex justify-center">
              <div className="h-24 w-24 rounded-lg bg-neutral-100 flex items-center justify-center">
                <span className="text-[10px] text-neutral-400">（扫码支付）</span>
              </div>
            </div>
          </div>

          {/* Buy Me a Coffee */}
          <a
            href="https://github.com/xinnix/opencode-scaffold"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-48 rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="mt-2 text-center text-xs font-medium text-neutral-600">Buy Me a Coffee</p>
            <p className="mt-1 text-center text-[10px] text-neutral-400">
              Star / Sponsor on GitHub
            </p>
          </a>
        </div>

        <p className="mt-8 text-sm text-neutral-400">
          你的每一份支持，都是这个项目持续迭代的动力 🙏
        </p>
      </div>
    </section>
  );
}
