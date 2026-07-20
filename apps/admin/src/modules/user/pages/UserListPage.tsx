import { useNavigate } from 'react-router-dom';
import { Tag, Space, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import { IS_ACTIVE_LABELS, IS_ACTIVE_COLORS } from '../components/UserDetail';

/**
 * User 列表页
 *
 * 使用 StandardListPage 配置驱动模式（只读列表）。
 * 用户通过微信登录自动创建，Admin 端只支持查看和状态管理。
 */
export function UserListPage() {
  const navigate = useNavigate();

  const columns: StandardListPageProps['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 100,
      render: (id: string) => (
        <span style={{ fontSize: 12, color: '#999' }}>{id.slice(0, 8)}...</span>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      render: (phone: string) => phone || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 120,
      render: (nickname: string) => nickname || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center' as const,
      render: (isActive: boolean) => (
        <Tag color={IS_ACTIVE_COLORS[isActive] || 'default'}>
          {IS_ACTIVE_LABELS[isActive] || '未知'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      width: 160,
      render: (date: string | null) => (date ? new Date(date).toLocaleString('zh-CN') : '从未登录'),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <StandardListPage
      resource="user"
      title="用户管理"
      columns={columns}
      searchFields={[{ field: 'search', placeholder: '搜索用户名、邮箱或手机号', width: 300 }]}
      hideCreateButton
      renderRowActions={(record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/users/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )}
    />
  );
}
