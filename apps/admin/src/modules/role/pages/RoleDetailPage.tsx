// apps/admin/src/modules/role/pages/RoleDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOne, useList, useDelete } from '@refinedev/core';
import { Card, Descriptions, Button, Space, Tag, Modal, List, Avatar, Tabs, Spin, App } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  KeyOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { PermissionCheckboxGroup } from '../components/PermissionCheckboxGroup';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

const trpcClient = getTrpcClient();

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  assignedAt: Date;
}

interface RoleDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: Permission[];
  _count: {
    users: number;
    permissions: number;
  };
}

export const RoleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const {
    result,
    isLoading,
    query: roleQuery,
  } = useOne<RoleDetail>({
    resource: 'role',
    id: id || '',
    queryOptions: {
      enabled: !!id,
    },
  }) as any;

  const { result: usersResult, query: usersQuery } = useList<User>({
    resource: 'role',
    id: id || '',
    action: 'getUsers',
    pagination: { pageSize: 10 },
    queryOptions: {
      enabled: !!id && activeTab === 'users',
    },
  }) as any;

  const { mutate: deleteOne } = useDelete();
  void deleteOne; // available for future delete operations

  const role = result;
  const users = usersResult || [];

  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions.map((p: Permission) => p.id));
    }
  }, [role]);

  useEffect(() => {
    if (activeTab === 'users' && id) {
      usersQuery.refetch();
    }
  }, [activeTab, id, usersQuery]);

  const handleUpdatePermissions = async () => {
    if (!role) return;

    setLoading(true);
    try {
      await (trpcClient as any).role.updatePermissions.mutate({
        roleId: role.id,
        permissionIds: selectedPermissions,
      });

      message.success('权限更新成功');
      setIsPermissionModalVisible(false);
      roleQuery.refetch();
    } catch (error) {
      console.error('Failed to update permissions:', error);
      message.error('权限更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>;
  }

  if (!role) {
    return <div style={{ padding: 24 }}>角色不存在</div>;
  }

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="角色名称" labelStyle={{ width: 120 }}>
            <Space>
              <SettingOutlined />
              {role.name}
              {role.isSystem && <Tag color="blue">系统角色</Tag>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="标识">{role.slug}</Descriptions.Item>
          <Descriptions.Item label="层级">
            <Tag color={role.level < 50 ? 'red' : role.level < 100 ? 'orange' : 'default'}>
              {role.level}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="用户数">
            <Tag icon={<TeamOutlined />} color="blue">
              {role._count.users}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="权限数">
            <Tag icon={<KeyOutlined />} color="green">
              {role._count.permissions}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {role.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(role.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(role.updatedAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'permissions',
      label: '权限管理',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={() => setIsPermissionModalVisible(true)}
            >
              编辑权限
            </Button>
          </div>

          <List
            dataSource={role.permissions}
            renderItem={(permission: Permission) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<KeyOutlined />} />}
                  title={
                    <Space>
                      <Tag color="blue">{permission.resource}</Tag>
                      <Tag color="green">{permission.action}</Tag>
                    </Space>
                  }
                  description={
                    permission.description || `${permission.resource}:${permission.action}`
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无权限' }}
          />
        </Space>
      ),
    },
    {
      key: 'users',
      label: '拥有该角色的用户',
      children: (
        <List
          dataSource={users}
          renderItem={(user: User) => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  size="small"
                  type="link"
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  查看详情
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<TeamOutlined />} />}
                title={user.username}
                description={
                  <Space>
                    <span>{user.email}</span>
                    <span>|</span>
                    <span>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</span>
                    <span>|</span>
                    <Tag color={user.isActive ? 'success' : 'error'}>
                      {user.isActive ? '激活' : '停用'}
                    </Tag>
                    <span>|</span>
                    <span>分配于: {new Date(user.assignedAt).toLocaleDateString('zh-CN')}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无用户拥有此角色' }}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/roles')}>
              返回
            </Button>
            <span>角色详情</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => message.info('请在列表页编辑角色信息')}>
              编辑
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="编辑权限"
        open={isPermissionModalVisible}
        onOk={handleUpdatePermissions}
        onCancel={() => setIsPermissionModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Spin spinning={loading}>
          <PermissionCheckboxGroup
            selectedIds={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        </Spin>
      </Modal>
    </div>
  );
};
