import type { PermissionKey } from './registry';

/**
 * StandardListPage 权限配置
 * 用于控制列表页中「新建」「编辑」「删除」按钮的显示
 */
export interface PermissionConfig {
  /** 创建权限（控制"新建"按钮） */
  create?: PermissionKey;
  /** 更新权限（控制"编辑"按钮） */
  update?: PermissionKey;
  /** 删除权限（控制"删除"按钮） */
  delete?: PermissionKey;
}
