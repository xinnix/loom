import { Tag } from 'antd';
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from './TodoForm';
import type { DetailFieldConfig } from '../../../shared/components/StandardDetailPage/types';

/**
 * Todo 详情字段配置
 *
 * 使用 StandardDetailPage 的配置驱动模式，
 * 支持 tags、boolean、datetime 等内置字段类型。
 */
export const todoDetailFields: DetailFieldConfig[] = [
  { key: 'title', label: '标题', type: 'text' },
  {
    key: 'description',
    label: '描述',
    type: 'text',
    showCondition: (entity: any) => !!entity.description,
  },
  {
    key: 'status',
    label: '状态',
    type: 'tag',
    tagColors: STATUS_COLORS,
    tagLabels: STATUS_LABELS,
  },
  {
    key: 'priority',
    label: '优先级',
    type: 'custom',
    render: (_val: any, entity: any) => (
      <Tag color={PRIORITY_COLORS[entity.priority] || 'default'}>
        {PRIORITY_LABELS[entity.priority] ?? entity.priority}
      </Tag>
    ),
  },
  {
    key: 'dueDate',
    label: '截止日期',
    type: 'date',
    showCondition: (entity: any) => !!entity.dueDate,
  },
  {
    key: 'isCompleted',
    label: '完成状态',
    type: 'boolean',
    booleanLabels: ['未完成', '已完成'],
    booleanColors: ['default', 'success'],
  },
  {
    key: 'createdAt',
    label: '创建时间',
    type: 'datetime',
  },
  {
    key: 'updatedAt',
    label: '更新时间',
    type: 'datetime',
  },
  {
    key: 'completedAt',
    label: '完成时间',
    type: 'datetime',
    showCondition: (entity: any) => !!entity.completedAt,
  },
];
