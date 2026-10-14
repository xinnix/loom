import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';
import { ChangelogEntrySchema, type ChangelogEntry, type ChangelogType } from '@loom/shared';

/**
 * CHANGELOG.md 读取与解析（ADR-010：文件真理源，管理端只读展示）。
 *
 * 约束的文件格式（解析宽容、校验严格——坏版本节跳过并 warn，不整页失败）：
 *   ## [版本号] - YYYY-MM-DD
 *   ### 新增|变更|修复|移除|安全（或 Added/Changed/Fixed/Removed/Security）
 *   - 条目文本
 *
 * mtime 缓存 + 候选路径（dev 仓库根 / 生产镜像 /app），文件缺席返回空列表（附属设施不阻断）。
 */

/** 分节标题 → 规范类型（中英文别名归一） */
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

/**
 * 候选路径（首个存在者生效）：
 * 1. `CHANGELOG_FILE` env 显式覆盖（任意部署形态）
 * 2. 从 __dirname 逐层向上探测（最多 6 层）——覆盖 dev（apps/api/src|dist/modules/changelog
 *    → 仓库根 5 层）与生产镜像（/app/dist/modules/changelog → /app 3 层，Dockerfile.api 显式 COPY）
 */
function resolveCandidates(): string[] {
  const list: string[] = [];
  if (process.env.CHANGELOG_FILE) list.push(process.env.CHANGELOG_FILE);
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    list.push(path.join(dir, 'CHANGELOG.md'));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return list;
}

const CANDIDATE_PATHS = resolveCandidates();

/** 版本头（日期可选；行尾允许多余文本，坏节靠 Zod 校验兜底跳过） */
const VERSION_RE = /^## \[(.+?)\]\s*(?:-\s*(\d{4}-\d{2}-\d{2}))?/;
const SECTION_RE = /^###\s+(.+?)\s*$/;
const ITEM_RE = /^[-*]\s+(.+?)\s*$/;

export class ChangelogReader {
  private readonly logger = new Logger(ChangelogReader.name);
  private cache: ChangelogEntry[] | null = null;
  private cachedMtime = -1;
  private warnedMissing = false;

  /** 全量条目（文件序即最新在前；mtime 未变走缓存） */
  getEntries(): ChangelogEntry[] {
    const file = CANDIDATE_PATHS.find((p) => fs.existsSync(p));
    if (!file) {
      if (!this.warnedMissing) {
        this.warnedMissing = true;
        this.logger.warn(
          `CHANGELOG.md 未找到（候选：${CANDIDATE_PATHS.join(' | ')}），更新日志页将为空`,
        );
      }
      return [];
    }
    const mtime = fs.statSync(file).mtimeMs;
    if (this.cache && mtime === this.cachedMtime) return this.cache;

    const parsed = this.parse(fs.readFileSync(file, 'utf-8'));
    this.cache = parsed;
    this.cachedMtime = mtime;
    return parsed;
  }

  /** 纯解析（导出供单测） */
  parse(markdown: string): ChangelogEntry[] {
    const lines = markdown.split(/\r?\n/);
    const entries: ChangelogEntry[] = [];
    let current: { version: string; date: string; groups: Map<ChangelogType, string[]> } | null =
      null;
    let currentType: ChangelogType | null = null;

    const flush = () => {
      if (!current) return;
      const groups = [...current.groups.entries()]
        .filter(([, items]) => items.length > 0)
        .map(([type, items]) => ({ type, items }));
      const check = ChangelogEntrySchema.safeParse({
        version: current.version,
        date: current.date,
        groups,
      });
      if (check.success) {
        entries.push(check.data);
      } else {
        this.logger.warn(
          `CHANGELOG.md 版本节 [${current.version}] 校验失败，已跳过：${check.error.issues.map((i) => i.message).join('; ')}`,
        );
      }
      current = null;
    };

    for (const line of lines) {
      const versionMatch = line.match(VERSION_RE);
      if (versionMatch) {
        flush();
        current = {
          version: versionMatch[1],
          date: versionMatch[2] ?? '',
          groups: new Map(),
        };
        currentType = null;
        continue;
      }
      if (!current) continue; // 版本节之外的导语/标题忽略
      const sectionMatch = line.match(SECTION_RE);
      if (sectionMatch) {
        const type = SECTION_ALIASES[sectionMatch[1].toLowerCase()];
        if (!type) {
          this.logger.warn(
            `CHANGELOG.md 未知分节「${sectionMatch[1]}」（版本 [${current.version}]），该节条目被忽略`,
          );
          currentType = null;
        } else {
          currentType = type;
          if (!current.groups.has(type)) current.groups.set(type, []);
        }
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
}
