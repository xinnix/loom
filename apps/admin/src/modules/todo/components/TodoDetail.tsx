import { Tag, Typography } from 'antd';
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from './TodoForm';
import dayjs from 'dayjs';

const { Text } = Typography;

/**
 * Todo 详情字段配置，配合 StandardDetailPage 使用
 *
 * 这里作为参考展示两种模式：
 *   1. 直接返回定义数组，供 StandardDetailPage 消费
 *   2. 也提供渲染函数供手写详情页使用
 */
export const todoDetailFields = (entity: any) => {
  const fields: Array<{ key: string; label: string; render: () => React.ReactNode }> = [];

  fields.push({
    key: 'title',
    label: '标题',
    render: () => <Text strong>{entity.title}</Text>,
  });

  if (entity.description) {
    fields.push({
      key: 'description',
      label: '描述',
      render: () => <Text>{entity.description}</Text>,
    });
  }

  fields.push(
    {
      key: 'status',
      label: '状态',
      render: () => (
        <Tag color={STATUS_COLORS[entity.status] || 'default'}>
          {STATUS_LABELS[entity.status] || entity.status}
        </Tag>
      ),
    },
    {
      key: 'priority',
      label: '优先级',
      render: () => (
        <Tag color={PRIORITY_COLORS[entity.priority] || 'default'}>
          {PRIORITY_LABELS[entity.priority] || entity.priority}
        </Tag>
      ),
    },
  );

  if (entity.dueDate) {
    fields.push({
      key: 'dueDate',
      label: '截止日期',
      render: () => <Text>{dayjs(entity.dueDate).format('YYYY-MM-DD')}</Text>,
    });
  }

  fields.push({
    key: 'isCompleted',
    label: '完成状态',
    render: () => (entity.isCompleted ? <Tag color="success">已完成</Tag> : <Tag>未完成</Tag>),
  });

  fields.push(
    {
      key: 'createdAt',
      label: '创建时间',
      render: () => <Text>{dayjs(entity.createdAt).format('YYYY-MM-DD HH:mm')}</Text>,
    },
    {
      key: 'updatedAt',
      label: '更新时间',
      render: () => <Text>{dayjs(entity.updatedAt).format('YYYY-MM-DD HH:mm')}</Text>,
    },
  );

  if (entity.completedAt) {
    fields.push({
      key: 'completedAt',
      label: '完成时间',
      render: () => <Text>{dayjs(entity.completedAt).format('YYYY-MM-DD HH:mm')}</Text>,
    });
  }

  return fields;
};
