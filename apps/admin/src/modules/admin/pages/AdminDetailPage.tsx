import { useParams, useNavigate } from 'react-router-dom';
import { useOne, useList } from '@refinedev/core';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Tabs,
  Table,
  Space,
  App,
  Spin,
  Empty,
  Avatar,
  Modal,
  Select,
  Popconfirm,
} from 'antd';
import { ArrowLeftOutlined, UserOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { trpcClient } from '../../../shared/dataProvider/dataProvider';

interface AdminRole {
  id: string;
  name: string;
  slug: string;
  level: number;
  description?: string;
  isSystem: boolean;
  assignedAt: string;
}

interface AdminDetail {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: AdminRole[];
}

export const AdminDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const { message } = App.useApp();

  const {
    result: admin,
    isLoading,
    query: adminQuery,
  } = useOne<AdminDetail>({
    resource: 'admin',
    id: id!,
  }) as any;

  const { result: rolesResult } = useList({
    resource: 'role',
    pagination: { pageSize: 100 },
  });

  const handleAssignRole = async () => {
    if (!selectedRoleId || !id) return;
    try {
      await (trpcClient as any).admin.assignRole.mutate({
        adminId: id,
        roleId: selectedRoleId,
      });
      message.success('角色分配成功');
      setIsAssignModalVisible(false);
      setSelectedRoleId(undefined);
      adminQuery.refetch();
    } catch (error: any) {
      message.error(error.message || '分配失败');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!id) return;
    try {
      await (trpcClient as any).admin.removeRole.mutate({
        adminId: id,
        roleId,
      });
      message.success('角色已移除');
      adminQuery.refetch();
    } catch (error: any) {
      message.error(error.message || '移除失败');
    }
  };

  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!admin) {
    return <Empty description="管理员不存在" />;
  }

  const availableRoles = ((rolesResult as any)?.data || []).filter(
    (r: any) => !admin.roles.some((ar) => ar.id === r.id),
  );

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户名">{admin.username}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{admin.email}</Descriptions.Item>
          <Descriptions.Item label="姓">{admin.lastName || '-'}</Descriptions.Item>
          <Descriptions.Item label="名">{admin.firstName || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={admin.isActive ? 'success' : 'error'}>
              {admin.isActive ? '启用' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱验证">
            <Tag color={admin.emailVerified ? 'success' : 'warning'}>
              {admin.emailVerified ? '已验证' : '未验证'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(admin.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(admin.updatedAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'roles',
      label: `角色 (${admin.roles.length})`,
      children: (
        <div style={{ padding: '24px 0' }}>
          <Card>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAssignModalVisible(true)}
                disabled={availableRoles.length === 0}
              >
                分配角色
              </Button>
            </div>
            {admin.roles.length > 0 ? (
              <Table
                dataSource={admin.roles}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '角色名称',
                    dataIndex: 'name',
                    render: (name: string, record: AdminRole) => (
                      <Tag
                        color={record.level <= 5 ? 'red' : record.level <= 10 ? 'blue' : 'default'}
                      >
                        {name}
                      </Tag>
                    ),
                  },
                  { title: '标识', dataIndex: 'slug' },
                  { title: '等级', dataIndex: 'level', width: 80 },
                  { title: '描述', dataIndex: 'description', render: (v: string) => v || '-' },
                  {
                    title: '分配时间',
                    dataIndex: 'assignedAt',
                    render: (date: string) => new Date(date).toLocaleString('zh-CN'),
                  },
                  {
                    title: '操作',
                    width: 100,
                    render: (_: any, record: AdminRole) => (
                      <Popconfirm
                        title="确认移除该角色？"
                        onConfirm={() => handleRemoveRole(record.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          移除
                        </Button>
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无角色" />
            )}
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admins')}>
            返回列表
          </Button>
        </Space>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={64} icon={<UserOutlined />} src={admin.avatar} />
          <div style={{ marginLeft: 16 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 'bold' }}>{admin.username}</h1>
            <Space style={{ marginTop: 8 }}>
              <Tag color={admin.isActive ? 'success' : 'error'}>
                {admin.isActive ? '启用' : '停用'}
              </Tag>
              {admin.roles.map((role) => (
                <Tag key={role.id} color={role.level <= 5 ? 'red' : 'blue'}>
                  {role.name}
                </Tag>
              ))}
            </Space>
          </div>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="分配角色"
        open={isAssignModalVisible}
        onOk={handleAssignRole}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setSelectedRoleId(undefined);
        }}
        okText="确认分配"
        cancelText="取消"
        okButtonProps={{ disabled: !selectedRoleId }}
      >
        <Select
          placeholder="请选择要分配的角色"
          value={selectedRoleId}
          onChange={setSelectedRoleId}
          style={{ width: '100%' }}
          options={availableRoles.map((r: any) => ({
            value: r.id,
            label: `${r.name} (${r.slug})`,
          }))}
        />
      </Modal>
    </div>
  );
};
