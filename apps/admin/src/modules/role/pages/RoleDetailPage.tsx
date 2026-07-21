import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOne, useList } from '@refinedev/core';
import { Button, Space, Tag, Modal, List, Avatar, Spin, App } from 'antd';
import { KeyOutlined, TeamOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';
import { StandardDetailPage } from '../../../shared/components/StandardDetailPage';
import type {
  DetailFieldConfig,
  DetailTabConfig,
} from '../../../shared/components/StandardDetailPage/types';
import { PermissionCheckboxGroup } from '../components/PermissionCheckboxGroup';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

const trpcClient = getTrpcClient();

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface RoleUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  assignedAt: Date;
}

interface RoleData {
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

/**
 * 角色详情字段配置
 */
const roleDetailFields: DetailFieldConfig[] = [
  {
    key: 'name',
    label: '角色名称',
    type: 'custom',
    render: (value: any, entity: any) => (
      <Space>
        <SettingOutlined />
        <span>{value}</span>
        {entity?.isSystem && <Tag color="blue">系统角色</Tag>}
      </Space>
    ),
  },
  { key: 'slug', label: '标识', type: 'tag' },
  {
    key: 'level',
    label: '层级',
    type: 'custom',
    render: (value: number) => (
      <Tag color={value < 50 ? 'red' : value < 100 ? 'orange' : 'default'}>{value}</Tag>
    ),
  },
  {
    key: '_count',
    label: '用户数',
    type: 'custom',
    render: (value: any, entity: any) => (
      <Tag icon={<TeamOutlined />} color="blue">
        {entity?._count?.users || 0}
      </Tag>
    ),
  },
  {
    key: '_count',
    label: '权限数',
    type: 'custom',
    render: (value: any, entity: any) => (
      <Tag icon={<KeyOutlined />} color="green">
        {entity?._count?.permissions || 0}
      </Tag>
    ),
  },
  { key: 'description', label: '描述', type: 'text', showCondition: (e: any) => !!e.description },
  { key: 'createdAt', label: '创建时间', type: 'datetime' },
  { key: 'updatedAt', label: '更新时间', type: 'datetime' },
];

// 渲染用户列表
const isActiveLabels: Record<boolean, string> = { true: '激活', false: '停用' };
const isActiveColors: Record<boolean, string> = { true: 'success', false: 'error' };

/**
 * 角色详情页
 *
 * 使用 StandardDetailPage 配置驱动模式。
 * 基础信息 Tab 通过 fields 配置，权限和用户 Tab 通过 render 插槽保留自定义渲染。
 */
export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const { data: roleData, query: roleQuery } = useOne<RoleData>({
    resource: 'role',
    id: id || '',
    queryOptions: { enabled: !!id },
  }) as any;

  const role: RoleData | undefined = roleData;
  const isLoading = roleQuery?.isLoading;

  const { data: usersData } = useList<RoleUser>({
    resource: 'role',
    id: id || '',
    action: 'getUsers',
    pagination: { pageSize: 10 },
    queryOptions: { enabled: !!id },
  }) as any;

  const users: RoleUser[] = usersData || [];

  // 初始化权限选择
  if (role?.permissions && selectedPermissions.length === 0) {
    setSelectedPermissions(role.permissions.map((p) => p.id));
  }

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

  const tabs: DetailTabConfig[] = [
    {
      key: 'permissions',
      label: '权限管理',
      render: (entity: any) => (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={() => {
                setSelectedPermissions(entity?.permissions?.map((p: Permission) => p.id) || []);
                setIsPermissionModalVisible(true);
              }}
            >
              编辑权限
            </Button>
          </div>
          <List
            dataSource={entity?.permissions || []}
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
      render: () => (
        <List
          dataSource={users}
          renderItem={(user: RoleUser) => (
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
                    <Tag color={isActiveColors[user.isActive]}>{isActiveLabels[user.isActive]}</Tag>
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

  // 用 renderTabContent 处理用户的懒加载
  const handleRenderTabContent = (tabKey: string, entity: any) => {
    if (tabKey === 'permissions') {
      const tab = tabs.find((t) => t.key === 'permissions');
      return tab?.render?.(entity || role);
    }
    if (tabKey === 'users') {
      const tab = tabs.find((t) => t.key === 'users');
      return tab?.render?.(entity || role);
    }
    return null;
  };

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>;
  }

  if (!role && !isLoading) {
    return <div style={{ padding: 24 }}>角色不存在</div>;
  }

  return (
    <>
      <StandardDetailPage
        resource="role"
        title="角色详情"
        backPath="/roles"
        backLabel="返回列表"
        headerType="none"
        fields={roleDetailFields}
        column={2}
        maxWidth={1000}
        tabs={[{ key: 'info', label: '基本信息' }, ...tabs]}
        renderTabContent={handleRenderTabContent}
        cardExtra={
          <Button icon={<EditOutlined />} onClick={() => navigate('/roles')}>
            编辑
          </Button>
        }
      />

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
    </>
  );
}
