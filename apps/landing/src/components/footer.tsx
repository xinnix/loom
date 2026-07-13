export function Footer() {
  return (
    <footer className="bg-neutral-950 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          {/* Brand */}
          <div>
            <a href="#" className="text-lg font-bold tracking-tight text-white">
              Open<span className="text-brand-500">Code</span>
            </a>
            <p className="mt-1 text-sm text-neutral-500">Agent-Centric 全栈开发框架</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="#harness"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              Agent Harness
            </a>
            <a
              href="#features"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              功能特性
            </a>
            <a
              href="#donate"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              赞助支持
            </a>
            <a
              href="https://github.com/xinnix/loom"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              GitHub
            </a>
          </div>

          {/* GitHub icon */}
          <a
            href="https://github.com/xinnix/loom"
            className="text-neutral-500 transition-colors hover:text-neutral-300"
            aria-label="GitHub"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.005-3.363-1.348-3.363-1.348-.454-1.152-1.11-1.458-1.11-1.458-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.656 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-.596 2.75-1.026 2.75-1.026.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>

        <div className="mt-8 border-t border-neutral-800 pt-6 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Loom. MIT License.
          </p>
          <p className="mt-2 text-xs text-neutral-600 sm:mt-0">
            用<span className="mx-1 text-brand-500">❤</span>
            构建 · 开源 · Agent-Driven
          </p>
        </div>
      </div>
    </footer>
  );
}
