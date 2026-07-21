import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Space, Tag, Modal, Form, Input, App } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import { AdminForm } from '../components/AdminForm';
import { trpcClient } from '../../../shared/dataProvider/dataProvider';

interface AdminRole {
  id: string;
  name: string;
  slug: string;
  level: number;
}

interface AdminRecord {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: AdminRole[];
}

interface RoleOption {
  id: string;
  name: string;
  slug: string;
  level: number;
}

/**
 * 管理员管理页面
 *
 * 使用 StandardListPage 配置驱动模式。
 * 重置密码通过独立 Modal 处理（非 StandardListPage 原生能力）。
 */
export function AdminListPage() {
  const navigate = useNavigate();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordRecord, setPasswordRecord] = useState<AdminRecord | null>(null);
  const [passwordForm] = Form.useForm();
  const { message } = App.useApp();

  const handleToggleActive = async (record: AdminRecord) => {
    try {
      await (trpcClient as any).admin.toggleActive.mutate({ id: record.id });
      message.success(record.isActive ? '已停用' : '已启用');
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleResetPassword = (record: AdminRecord) => {
    setPasswordRecord(record);
    passwordForm.resetFields();
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      await (trpcClient as any).admin.resetPassword.mutate({
        adminId: passwordRecord!.id,
        newPassword: values.newPassword,
      });
      message.success('密码重置成功');
      setIsPasswordModalVisible(false);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '重置失败');
    }
  };

  const getRoleTagColor = (level: number) => {
    if (level <= 5) return 'red';
    if (level <= 10) return 'blue';
    return 'default';
  };

  const columns: StandardListPageProps['columns'] = [
    {
      title: '管理员',
      dataIndex: 'username',
      width: 200,
      render: (username: string, record: any) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} src={record.avatar} />
          <span style={{ fontWeight: 500 }}>{username}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
    },
    {
      title: '姓名',
      width: 120,
      render: (_: any, record: any) => {
        const name = [record.lastName, record.firstName].filter(Boolean).join('');
        return name || '-';
      },
    },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 200,
      render: (roles: AdminRole[]) =>
        roles.length > 0 ? (
          roles.map((role) => (
            <Tag key={role.id} color={getRoleTagColor(role.level)}>
              {role.name}
            </Tag>
          ))
        ) : (
          <Tag>无角色</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 90,
      render: (isActive: boolean, record: any) => (
        <Button
          size="small"
          type="text"
          icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
          style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}
          onClick={() => handleToggleActive(record as AdminRecord)}
        >
          {isActive ? '启用' : '停用'}
        </Button>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      width: 160,
      render: (date: string) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <>
      <StandardListPage
        resource="admin"
        title="管理员管理"
        columns={columns}
        formComponent={AdminForm}
        formWidth={520}
        searchFields={[{ field: 'search', placeholder: '搜索用户名、邮箱或姓名', width: 300 }]}
        permissions={{
          create: 'admin:create',
          update: 'admin:update',
          delete: 'admin:delete',
        }}
        renderRowActions={(record: any) => (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admins/${record.id}`)}
            >
              详情
            </Button>
            <Button
              type="link"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record as AdminRecord)}
            >
              重置密码
            </Button>
          </Space>
        )}
      />

      <Modal
        title="重置密码"
        open={isPasswordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => setIsPasswordModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少 8 个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少 8 个字符）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
