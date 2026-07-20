import { Permission } from './registry';

export interface PermissionEntry {
  resource: string;
  action: string;
}

/**
 * 从 registry 导出所有权限条目
 * 用于自动生成 Seed SQL 或运行时注册
 */
export function getAllPermissionEntries(): PermissionEntry[] {
  const entries: PermissionEntry[] = [];
  for (const [resource, actions] of Object.entries(Permission)) {
    for (const action of Object.keys(actions)) {
      entries.push({ resource, action });
    }
  }
  return entries;
}

/**
 * 生成 insert SQL 片段
 * 注意：id 需要替换为实际值（或使用 uuid）
 */
export function generateSeedSql(): string {
  const entries = getAllPermissionEntries();
  return entries
    .map((e, i) => `  ('p${i + 1}', '${e.resource}', '${e.action}', '${e.resource} ${e.action}'),`)
    .join('\n');
}
