import { useParams, useNavigate } from 'react-router-dom';
import { useOne, useList } from '@refinedev/core';
import {
  Tag,
  Button,
  Space,
  App,
  Spin,
  Empty,
  Avatar,
  Modal,
  Select,
  Popconfirm,
  Table,
} from 'antd';
import { UserOutlined, PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { StandardDetailPage } from '../../../shared/components/StandardDetailPage';
import type {
  DetailFieldConfig,
  DetailTabConfig,
} from '../../../shared/components/StandardDetailPage/types';
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

const getRoleColor = (level: number) => {
  if (level <= 5) return 'red';
  if (level <= 10) return 'blue';
  return 'default';
};

const adminDetailFields: DetailFieldConfig[] = [
  { key: 'username', label: '用户名', type: 'text' },
  { key: 'email', label: '邮箱', type: 'email' },
  { key: 'lastName', label: '姓', type: 'text', showCondition: (e: any) => !!e.lastName },
  { key: 'firstName', label: '名', type: 'text', showCondition: (e: any) => !!e.firstName },
  {
    key: 'isActive',
    label: '状态',
    type: 'boolean',
    booleanLabels: ['停用', '启用'],
    booleanColors: ['error', 'success'],
  },
  {
    key: 'emailVerified',
    label: '邮箱验证',
    type: 'custom',
    render: (value: boolean | null) => (
      <Tag color={value ? 'success' : 'warning'}>{value ? '已验证' : '未验证'}</Tag>
    ),
  },
  {
    key: 'lastLoginAt',
    label: '最后登录',
    type: 'datetime',
    fallback: '-',
  },
  { key: 'createdAt', label: '创建时间', type: 'datetime' },
  { key: 'updatedAt', label: '更新时间', type: 'datetime' },
];

/**
 * 管理员详情页
 *
 * 使用 StandardDetailPage 配置驱动模式。
 * 基本信息 Tab 通过 fields 配置，角色管理 Tab 通过 renderTabContent 保留自定义渲染。
 */
export function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const { message } = App.useApp();

  const { data: adminData, query: adminQuery } = useOne<any>({
    resource: 'admin',
    id: id || '',
    queryOptions: { enabled: !!id },
  }) as any;

  const { data: rolesResult } = useList({
    resource: 'role',
    pagination: { pageSize: 100 },
  });

  const admin = adminData;
  const allRoles = (rolesResult as any)?.data || [];

  const isLoading = adminQuery?.isLoading;

  const handleAssignRole = async () => {
    if (!selectedRoleId || !id) return;
    try {
      await (trpcClient as any).admin.assignRole.mutate({ adminId: id, roleId: selectedRoleId });
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
      await (trpcClient as any).admin.removeRole.mutate({ adminId: id, roleId });
      message.success('角色已移除');
      adminQuery.refetch();
    } catch (error: any) {
      message.error(error.message || '移除失败');
    }
  };

  const availableRoles = allRoles.filter(
    (r: any) => !admin?.roles?.some((ar: any) => ar.id === r.id),
  );

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

  return (
    <>
      <StandardDetailPage
        resource="admin"
        title="管理员详情"
        backPath="/admins"
        backLabel="返回列表"
        headerType="none"
        fields={adminDetailFields}
        column={2}
        maxWidth={1000}
        cardExtra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={availableRoles.length === 0}
              onClick={() => setIsAssignModalVisible(true)}
            >
              分配角色
            </Button>
          </Space>
        }
        tabs={[
          { key: 'info', label: '基本信息' },
          {
            key: 'roles',
            label: `角色 (${admin.roles?.length || 0})`,
            render: (entity: any) => {
              const roles = entity?.roles || [];
              return (
                <div style={{ padding: '24px 0' }}>
                  {roles.length > 0 ? (
                    <Table
                      dataSource={roles}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: '角色名称',
                          dataIndex: 'name',
                          render: (name: string, record: AdminRole) => (
                            <Tag color={getRoleColor(record.level)}>{name}</Tag>
                          ),
                        },
                        { title: '标识', dataIndex: 'slug' },
                        { title: '等级', dataIndex: 'level', width: 80 },
                        {
                          title: '描述',
                          dataIndex: 'description',
                          render: (v: string) => v || '-',
                        },
                        {
                          title: '分配时间',
                          dataIndex: 'assignedAt',
                          render: (date: string) =>
                            date ? new Date(date).toLocaleString('zh-CN') : '-',
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
                </div>
              );
            },
          },
        ]}
      />

      <Modal
        title="分配角色"
        open={isAssignModalVisible}
        onOk={handleAssignRole}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setSelectedRoleId(undefined);
        }}
        okText="确定"
        cancelText="取消"
      >
        <Select
          style={{ width: '100%' }}
          placeholder="请选择角色"
          value={selectedRoleId}
          onChange={setSelectedRoleId}
          options={availableRoles.map((r: any) => ({
            value: r.id,
            label: `${r.name} (${r.slug})`,
          }))}
        />
      </Modal>
    </>
  );
}
