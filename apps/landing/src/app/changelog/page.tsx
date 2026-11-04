import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Metadata } from 'next';

/**
 * 更新日志页（ADR-010：文件真理源 = 仓库根 CHANGELOG.md）。
 *
 * Landing 是 SSG 静态导出，本页在 `next build` 时以 server component 执行：
 * 构建期读取并解析 CHANGELOG.md，把条目静态渲染进 HTML，无运行时依赖。
 * 解析逻辑移植自 apps/api/src/modules/changelog/changelog.reader.ts（三正则状态机，
 * 解析宽容、校验严格——坏版本节跳过，不整页失败）。
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type ChangelogType = 'added' | 'changed' | 'fixed' | 'removed' | 'security';

interface ChangelogGroup {
  type: ChangelogType;
  items: string[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  groups: ChangelogGroup[];
}

/** 分节标题 → 规范类型（中英文别名归一，与 API 端 reader 保持一致） */
const SECTION_ALIASES: Record<string, ChangelogType> = {
  新增: 'added',
  added: 'added',
  变更: 'changed',
  changed: 'changed',
  修复: 'fixed',
  fixed: 'fixed',
  移除: 'removed',
  removed: 'removed',
  安全: 'security',
  security: 'security',
};

const VERSION_RE = /^## \[(.+?)\]\s*(?:-\s*(\d{4}-\d{2}-\d{2}))?/;
const SECTION_RE = /^###\s+(.+?)\s*$/;
const ITEM_RE = /^[-*]\s+(.+?)\s*$/;

/**
 * 候选路径（首个存在者生效）：
 * 1. `CHANGELOG_FILE` env 显式覆盖（任意部署形态）
 * 2. `CHANGELOG.md` / `../../CHANGELOG.md`——构建时 process.cwd() 恒为 apps/landing，
 *    向上两级即仓库根（本地 dev/build 与 CI Pages 构建同构）
 */
function resolveChangelogFile(): string | null {
  const candidates = [
    process.env.CHANGELOG_FILE,
    'CHANGELOG.md',
    path.join('..', '..', 'CHANGELOG.md'),
  ].filter((p): p is string => Boolean(p));
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/** 纯解析（文件序即最新在前） */
function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let current: { version: string; date: string; groups: Map<ChangelogType, string[]> } | null =
    null;
  let currentType: ChangelogType | null = null;

  const flush = () => {
    if (!current) return;
    const groups = [...current.groups.entries()]
      .filter(([, items]) => items.length > 0)
      .map(([type, items]) => ({ type, items }));
    if (groups.length > 0) entries.push({ version: current.version, date: current.date, groups });
    current = null;
  };

  for (const line of markdown.split(/\r?\n/)) {
    const versionMatch = line.match(VERSION_RE);
    if (versionMatch) {
      flush();
      current = { version: versionMatch[1], date: versionMatch[2] ?? '', groups: new Map() };
      currentType = null;
      continue;
    }
    if (!current) continue; // 版本节之外的导语/标题忽略
    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      currentType = SECTION_ALIASES[sectionMatch[1].toLowerCase()] ?? null;
      if (currentType && !current.groups.has(currentType)) current.groups.set(currentType, []);
      continue;
    }
    const itemMatch = line.match(ITEM_RE);
    if (itemMatch && currentType) {
      current.groups.get(currentType)!.push(itemMatch[1]);
    }
  }
  flush();
  return entries;
}

function getEntries(): ChangelogEntry[] {
  const file = resolveChangelogFile();
  if (!file) {
    console.warn('CHANGELOG.md 未找到，更新日志页将为空');
    return [];
  }
  return parseChangelog(fs.readFileSync(file, 'utf-8'));
}

/** 类型徽章（颜色语义对齐管理端 ChangelogPage 的 TYPE_META） */
const TYPE_META: Record<ChangelogType, { label: string; badgeClass: string }> = {
  added: { label: '新增', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  changed: { label: '变更', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  fixed: { label: '修复', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  removed: { label: '移除', badgeClass: 'bg-red-50 text-red-700 border-red-200' },
  security: { label: '安全', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
};

/** 条目内联渲染：反引号 → <code>（CHANGELOG.md 不含 markdown 链接） */
function renderInline(text: string, keyPrefix: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
      <code
        key={`${keyPrefix}-${i}`}
        className="font-code-snippet text-code-snippet text-primary bg-primary/5 border border-primary/15 px-1.5 py-0.5 rounded"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  );
}

export const metadata: Metadata = {
  title: '更新日志 — Loom',
  description: 'Loom 版本变更日志：每次改动的完整编年记录，由仓库 CHANGELOG.md 构建期生成。',
};

export default function ChangelogPage() {
  const entries = getEntries();

  return (
    <>
      {/* 简洁顶栏 */}
      <header className="sticky top-0 w-full z-50 bg-surface-acrylic backdrop-blur-xl shadow-[0_1px_0_rgba(16,24,40,0.06)]">
        <div className="h-16 max-w-5xl mx-auto px-margin md:px-margin-desktop flex items-center justify-between">
          <a className="flex items-center gap-space-sm group" href={`${basePath}/`}>
            <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary group-hover:text-primary-fixed transition-colors">
              <span className="material-symbols-outlined text-[18px]">polyline</span>
            </div>
            <span className="font-headline-md text-headline-md font-bold tracking-tight text-text-primary uppercase">
              LOOM
            </span>
          </a>
          <a
            className="flex items-center gap-1.5 font-label-mono text-label-mono text-on-surface-variant hover:text-primary transition-colors"
            href={`${basePath}/`}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            返回首页
          </a>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-margin md:px-margin-desktop pt-space-2xl pb-space-3xl">
        {/* 页头 */}
        <div className="mb-space-2xl pb-space-lg border-b border-border-subtle">
          <div className="flex items-center gap-2 font-label-caps text-label-caps text-primary tracking-widest uppercase">
            <span className="text-text-muted">[</span> CHANGELOG{' '}
            <span className="text-text-muted">]</span>
          </div>
          <h1 className="mt-2 font-headline-xl text-headline-xl font-bold text-text-primary tracking-tight">
            更新日志
          </h1>
          <p className="mt-2 font-body-md text-body-md text-text-muted max-w-2xl">
            版本编年记录，与仓库根 CHANGELOG.md 同源（ADR-010
            文件真理源），构建时自动生成。新版本在上。
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="py-space-2xl text-center font-body-md text-body-md text-text-muted">
            暂无更新日志。
          </div>
        ) : (
          <div className="space-y-space-xl">
            {entries.map((entry, idx) => (
              <section
                key={entry.version}
                className="relative bg-surface-elevated/80 border border-border-subtle rounded-lg"
              >
                {/* 版本头 */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-space-lg py-space-md border-b border-border-subtle/70 bg-surface-container-lowest/60 rounded-t-lg">
                  <div className="flex items-center gap-space-sm">
                    <span className="px-2.5 py-1 rounded bg-primary/10 border border-primary/25 font-label-mono text-label-mono text-primary font-bold">
                      v{entry.version}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-caps text-label-caps uppercase">
                        Latest
                      </span>
                    )}
                  </div>
                  {entry.date && (
                    <span className="font-label-mono text-label-mono text-text-muted">
                      {entry.date}
                    </span>
                  )}
                </div>

                {/* 类型分组 */}
                <div className="px-space-lg py-space-md space-y-space-lg">
                  {entry.groups.map((group) => {
                    const meta = TYPE_META[group.type];
                    return (
                      <div key={group.type} className="space-y-space-sm">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-label-caps text-label-caps uppercase ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <ul className="space-y-space-sm">
                          {group.items.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 font-body-md text-body-md text-on-surface leading-relaxed"
                            >
                              <span className="w-1 h-1 rounded-full bg-primary/60 mt-2 shrink-0" />
                              <span className="min-w-0">
                                {renderInline(item, `${entry.version}-${group.type}-${i}`)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* 简洁页脚 */}
      <footer className="relative z-10 w-full bg-surface-container-lowest mt-auto">
        <div className="max-w-5xl mx-auto px-margin md:px-margin-desktop py-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <p className="font-body-md text-body-md text-text-muted">
            © {new Date().getFullYear()} Loom Framework. 为自主智能体提供精准编织。
          </p>
          <a
            className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary transition-colors"
            href="https://github.com/xinnix/loom"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/xinnix/loom
          </a>
        </div>
      </footer>
    </>
  );
}
