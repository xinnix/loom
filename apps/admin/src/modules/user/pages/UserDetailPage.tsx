// apps/admin/src/modules/user/pages/UserDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useOne } from '@refinedev/core';
import { Card, Descriptions, Button, Space, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

interface UserDetail {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { result: user, isLoading } = useOne<UserDetail>({
    resource: 'user',
    id: id || '',
  }) as any;

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <div>用户不存在</div>;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
              返回
            </Button>
            <span>用户详情</span>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名" labelStyle={{ width: 120 }}>
            <Space>
              <UserOutlined />
              {user.username}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            <Space>
              <MailOutlined />
              {user.email}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="姓名">{fullName || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag
              color={user.isActive ? 'success' : 'error'}
              icon={user.isActive ? <CheckCircleOutlined /> : <StopOutlined />}
            >
              {user.isActive ? '激活' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            <Space>
              <ClockCircleOutlined />
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(user.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱验证">
            {user.emailVerified ? (
              <Tag color="success">已验证</Tag>
            ) : (
              <Tag color="warning">未验证</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(user.updatedAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};
