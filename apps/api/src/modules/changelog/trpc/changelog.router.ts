import { ChangelogQuerySchema, Permission, type ChangelogEntry } from '@loom/shared';
import { router, permissionProcedure } from '../../../trpc/trpc';
import { ChangelogReader } from '../changelog.reader';

// 文件真理源无 DI 依赖（纯 fs 读取 + mtime 缓存），模块级单例即可
const reader = new ChangelogReader();

/**
 * 变更日志 router（ADR-010，只读）。
 * 数据量小（单文件），类型/关键字过滤在内存完成。
 */
export const changelogRouter = router({
  getEntries: permissionProcedure(Permission.changelog.read)
    .input(ChangelogQuerySchema)
    .query(({ input }) => {
      let entries = reader.getEntries();
      if (input?.type) {
        entries = entries
          .map((e) => ({ ...e, groups: e.groups.filter((g) => g.type === input.type) }))
          .filter((e) => e.groups.length > 0);
      }
      const keyword = input?.keyword?.trim().toLowerCase();
      if (keyword) {
        entries = entries
          .map((e) => {
            // 版本号命中 → 整节保留；否则条目级过滤，组空则丢弃该版本
            if (e.version.toLowerCase().includes(keyword)) return e;
            const groups = e.groups
              .map((g) => ({
                ...g,
                items: g.items.filter((i) => i.toLowerCase().includes(keyword)),
              }))
              .filter((g) => g.items.length > 0);
            return groups.length > 0 ? { ...e, groups } : null;
          })
          .filter((e): e is ChangelogEntry => e !== null);
      }
      return entries;
    }),
});
