import { useNavigate } from 'react-router-dom';
import { Tag, Space } from 'antd';
import { TeamOutlined, KeyOutlined } from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import { RoleForm } from '../components/RoleForm';

/**
 * 角色管理页面
 *
 * 系统固定四种角色，不允许创建，系统角色不可删除：
 * - 超级管理员 (super_admin)
 * - 管理员 (department_admin)
 * - 处理员 (handler)
 * - 普通用户 (user)
 */
export function RoleListPage() {
  const navigate = useNavigate();

  const columns: StandardListPageProps['columns'] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: any) => (
        <a onClick={() => navigate(`/roles/${record.id}`)} style={{ cursor: 'pointer' }}>
          <Space>
            <span>{name}</span>
            {record.isSystem && <Tag color="blue">系统</Tag>}
          </Space>
        </a>
      ),
    },
    {
      title: '标识',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
      render: (slug: string) => <Tag color="default">{slug}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-',
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => (
        <Tag color={level === 0 ? 'red' : level < 50 ? 'orange' : 'default'}>{level}</Tag>
      ),
    },
    {
      title: '用户数',
      key: 'userCount',
      width: 100,
      render: (_: any, record: any) => (
        <Tag icon={<TeamOutlined />} color="blue">
          {record._count?.users || 0}
        </Tag>
      ),
    },
    {
      title: '权限数',
      key: 'permissionCount',
      width: 100,
      render: (_: any, record: any) => (
        <Tag icon={<KeyOutlined />} color="green">
          {record._count?.permissions || 0}
        </Tag>
      ),
    },
  ];

  return (
    <StandardListPage
      resource="role"
      title="角色管理"
      columns={columns}
      formComponent={RoleForm}
      formWidth={600}
      hideCreateButton
      searchFields={[{ field: 'search', placeholder: '搜索角色名称或标识' }]}
    />
  );
}
