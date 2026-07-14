'use client';

import { useEffect, useState } from 'react';

const stats = [
  { value: '19', label: '内置 Skill' },
  { value: '10', label: 'Slash 命令' },
  { value: '7', label: '自动化钩子' },
  { value: '5', label: '端覆盖' },
];

const AnimatedStat = ({ value, label, index }: { value: string; label: string; index: number }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`flex flex-col items-center transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <span className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{value}</span>
      <span className="mt-1 text-xs font-medium text-neutral-400 sm:text-sm">{label}</span>
    </div>
  );
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 pt-28 pb-24 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-brand-600 opacity-8 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-12 h-72 w-72 rounded-full bg-brand-500 opacity-10 blur-[100px]" />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-800 bg-brand-950/60 px-3 py-1 text-xs font-medium text-brand-300 backdrop-blur-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-brand-400" />为 Claude Code 量身定制
        </div>

        {/* H1 */}
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          第一个为 <span className="text-brand-400">Claude Code</span> 打造的
          <br />
          全栈开发底座
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
          Loom 不是又一个脚手架模板。
          <br className="hidden sm:inline" />
          它是围绕 AI Agent 工作流重新设计的全栈基础设施 —
          <br className="hidden sm:inline" />
          <span className="text-neutral-300">
            19 个 Skill · 10 个命令 · 7 个自动化钩子
            <br className="sm:hidden" /> Claude Code 开箱即用
          </span>
        </p>

        {/* Stats row */}
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-4 gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-5 backdrop-blur-sm sm:px-6 sm:py-6">
          {stats.map((s, i) => (
            <AnimatedStat key={s.label} {...s} index={i} />
          ))}
        </div>

        {/* One-liner contrast */}
        <p className="mx-auto mt-6 max-w-xl text-xs text-neutral-500 sm:text-sm">
          不是又一个无差别的模板起点&mdash;而是让 Claude 真正理解你项目结构的开发基础设施
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="#features"
            className="inline-flex items-center rounded-lg bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-500 hover:shadow-xl hover:shadow-brand-500/40 active:scale-[0.97]"
          >
            git clone 开始
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
            href="https://github.com/xinnix/loom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-7 py-3 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.005-3.363-1.348-3.363-1.348-.454-1.152-1.11-1.458-1.11-1.458-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.656 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-.596 2.75-1.026 2.75-1.026.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
