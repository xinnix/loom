import { useNavigate } from 'react-router-dom';
import { Tag, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import {
  TodoForm,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '../components';
import { Permission } from '@loom/shared';
import dayjs from 'dayjs';

/**
 * Todo 列表页
 *
 * 使用 StandardListPage 组件，通过配置驱动。
 * 展示了 StandardListPage 的完整用法，包括：
 *   - 搜索字段配置（searchFields）
 *   - 筛选字段配置（filterFields）
 *   - 表格列定义（columns）
 *   - 表单组件集成（formComponent）
 *   - 行操作按钮（renderRowActions）
 *
 * @see StandardListPage 组件：apps/admin/src/shared/components/StandardListPage/
 */
export function TodoListPage() {
  const navigate = useNavigate();

  const columns: StandardListPageProps['columns'] = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{STATUS_LABELS[status] || status}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: number) => (
        <Tag color={PRIORITY_COLORS[priority] || 'default'}>
          {PRIORITY_LABELS[priority] ?? priority}
        </Tag>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (val: string | null) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '完成',
      dataIndex: 'isCompleted',
      key: 'isCompleted',
      width: 70,
      render: (val: boolean) => (val ? <Tag color="success">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <StandardListPage
      resource="todo"
      title="Todo 示例管理"
      columns={columns}
      formComponent={TodoForm}
      formWidth={520}
      searchFields={[{ field: 'search', placeholder: '搜索标题/描述' }]}
      filterFields={[
        {
          field: 'status',
          type: 'select',
          placeholder: '状态',
          options: [
            { value: 'pending', label: '待处理' },
            { value: 'in_progress', label: '进行中' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ],
        },
      ]}
      permissions={{
        create: Permission.todo.create,
        update: Permission.todo.update,
        delete: Permission.todo.delete,
      }}
      renderRowActions={(record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/todos/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )}
    />
  );
}
