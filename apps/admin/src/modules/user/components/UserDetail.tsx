import { Tag } from 'antd';
import type { DetailFieldConfig } from '../../../shared/components/StandardDetailPage/types';

/**
 * User 详情字段配置
 */
export const userDetailFields: DetailFieldConfig[] = [
  { key: 'username', label: '用户名', type: 'text' },
  { key: 'email', label: '邮箱', type: 'email' },
  { key: 'nickname', label: '昵称', type: 'text', showCondition: (e: any) => !!e.nickname },
  { key: 'phone', label: '手机号', type: 'text', showCondition: (e: any) => !!e.phone },
  { key: 'openid', label: '微信 OpenID', type: 'text', showCondition: (e: any) => !!e.openid },
  {
    key: 'isActive',
    label: '状态',
    type: 'boolean',
    booleanLabels: ['停用', '激活'],
    booleanColors: ['red', 'green'],
  },
  {
    key: 'lastLoginAt',
    label: '最后登录',
    type: 'datetime',
    showCondition: (e: any) => !!e.lastLoginAt,
    fallback: '从未登录',
  },
  {
    key: 'createdAt',
    label: '注册时间',
    type: 'datetime',
  },
  {
    key: 'updatedAt',
    label: '更新时间',
    type: 'datetime',
  },
];

/**
 * 活跃状态标签映射
 */
export const IS_ACTIVE_LABELS: Record<boolean, string> = {
  true: '激活',
  false: '停用',
};

export const IS_ACTIVE_COLORS: Record<boolean, string> = {
  true: 'success',
  false: 'error',
};
