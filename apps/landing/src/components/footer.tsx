import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-neutral-950 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              Loom
            </Link>
            <p className="mt-1 text-sm text-neutral-500">为 Claude Code 打造的全栈开发底座</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="#features"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              特性
            </a>
            <a
              href="#comparison"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              对比
            </a>
            <a
              href="#sponsor"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              赞助 ☕
            </a>
            <a
              href="https://github.com/xinnix/loom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-800 pt-6 text-center">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Loom. MIT License.
          </p>
          <p className="mt-2 text-xs text-neutral-600">
            用 ❤️ 和 ☕️ 打造 ·{' '}
            <a href="#sponsor" className="underline underline-offset-2 hover:text-neutral-400">
              赞助支持
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
