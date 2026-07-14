export function SponsorSection() {
  return (
    <section id="sponsor" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-600">
          <span className="flex h-1.5 w-1.5 rounded-full bg-accent-500" />
          赞助支持
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          请作者喝杯咖啡 ☕️
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-neutral-500">
          Loom 是一个开源项目，维护它需要持续的时间精力。 如果 Loom
          帮你节省了时间，请我喝杯咖啡让我继续为爱发电。
        </p>

        {/* Payment methods */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* WeChat */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045.246.246 0 00.242-.245c0-.06-.024-.12-.04-.178l-.325-1.233a.49.49 0 01.178-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.87-7.062-6.122zM16.573 12.2c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.544.434-.983.97-.983zm-4.844 0c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.544.434-.983.97-.983z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">微信支付</h3>
            <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50">
              <span className="px-2 text-center text-[10px] text-neutral-400">
                收款码占位
                <br />
                （替换为实际二维码）
              </span>
            </div>
          </div>

          {/* Alipay */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.422 15.358c-3.22-1.386-6.847-2.408-10.299-3.819 1.398-1.533 2.588-3.354 3.246-5.422H10.54v-1.76h5.956V3.48H10.54V1.1H8.643c-.19 0-.381.15-.381.35v2.03H4.22v1.76h6.493v.01c-.828 2.185-2.239 4.095-4.025 5.564-.534-.808-1.024-1.68-1.384-2.646-.165-.442-.582-.727-1.068-.767-.832-.038-1.432.648-1.247 1.473.772 3.461 3.508 6.593 6.626 7.98-1.334 1.666-3.34 3.076-6.318 4.004a1.207 1.207 0 00-.733.876c-.07.477.387.933.861.86 5.476-.85 9.956-3.651 13.107-7.743 2.729.742 5.518 1.365 8.124 2.511.416.183.8-.22.675-.656-.154-.545-.575-1.216-.575-1.216z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">支付宝</h3>
            <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50">
              <span className="px-2 text-center text-[10px] text-neutral-400">
                收款码占位
                <br />
                （替换为实际二维码）
              </span>
            </div>
          </div>
        </div>

        {/* Online sponsors */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="https://github.com/sponsors/xinnix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            GitHub Sponsors
          </a>
          <a
            href="https://www.buymeacoffee.com/xinnix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21.5C2 20.12 3.12 19 4.5 19h15c1.38 0 2.5 1.12 2.5 2.5v1H2v-1z" />
              <path d="M21 10.5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v4c0 3.31 2.69 6 6 6h6c3.31 0 6-2.69 6-6v-4z" />
            </svg>
            Buy Me a Coffee
          </a>
        </div>

        {/* Thank you note */}
        <p className="mt-10 text-xs text-neutral-400">
          感谢每一位赞助者的支持 ❤️ 你的咖啡让这个项目能持续迭代
        </p>
      </div>
    </section>
  );
}
