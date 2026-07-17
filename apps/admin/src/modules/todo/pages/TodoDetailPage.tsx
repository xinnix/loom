import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useOne } from '@refinedev/core';
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '../components';
import dayjs from 'dayjs';

/**
 * Todo 详情页
 *
 * 展示了两种详情页模式：
 *   1. 使用 StandardDetailPage（配置驱动，推荐）
 *   2. 手动编写 Descriptions（灵活但手写内容多）
 *
 * 这里用方式 2 展示，方便对比。
 *
 * @see StandardDetailPage 组件：apps/admin/src/shared/components/StandardDetailPage/
 */
export function TodoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { result: todo, isLoading } = useOne<any>({
    resource: 'todo',
    id: id!,
  }) as any;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!todo) {
    return <Card>未找到该 Todo</Card>;
  }

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/todos')} />
          <span>Todo 详情</span>
        </Space>
      }
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="标题" span={2}>
          <strong>{todo.title}</strong>
        </Descriptions.Item>

        {todo.description && (
          <Descriptions.Item label="描述" span={2}>
            {todo.description}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="状态">
          <Tag color={STATUS_COLORS[todo.status] || 'default'}>
            {STATUS_LABELS[todo.status] || todo.status}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="优先级">
          <Tag color={PRIORITY_COLORS[todo.priority] || 'default'}>
            {PRIORITY_LABELS[todo.priority] ?? todo.priority}
          </Tag>
        </Descriptions.Item>

        {todo.dueDate && (
          <Descriptions.Item label="截止日期">
            {dayjs(todo.dueDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="完成状态">
          {todo.isCompleted ? <Tag color="success">已完成</Tag> : <Tag>未完成</Tag>}
        </Descriptions.Item>

        <Descriptions.Item label="创建时间">
          {dayjs(todo.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>

        <Descriptions.Item label="更新时间">
          {dayjs(todo.updatedAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>

        {todo.completedAt && (
          <Descriptions.Item label="完成时间">
            {dayjs(todo.completedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}
