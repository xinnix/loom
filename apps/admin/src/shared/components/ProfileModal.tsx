import { Modal, Form, Input, Avatar, Space, Typography, App } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getTrpcClient } from '../trpc/trpcClient';
import { OSSUpload } from './OSSUpload';
import { useAuth } from '../auth';

interface ProfileModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ProfileModal = ({ visible, onCancel, onSuccess }: ProfileModalProps) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { user } = useAuth();

  // Update avatar mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const trpcClient = (await getTrpcClient()) as any;
      return trpcClient.auth.updateAdminProfile.mutate({ avatar: avatarUrl });
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        username: user?.username,
        email: user?.email,
        avatar: user?.avatar,
      });
    }
  }, [visible, user, form]);

  const handleAvatarChange = async (avatarUrl: string) => {
    if (!avatarUrl) return;

    try {
      const updatedUser = await updateProfileMutation.mutateAsync(avatarUrl);

      // Update localStorage user info
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newUser = { ...storedUser, avatar: updatedUser.avatar };
      localStorage.setItem('user', JSON.stringify(newUser));

      message.success('头像更新成功');
      onSuccess();
    } catch (error: any) {
      message.error(error.message || '头像更新失败');
    }
  };

  return (
    <Modal title="个人信息" open={visible} onCancel={onCancel} footer={null} width={500}>
      <Form form={form} layout="vertical">
        <Form.Item label="用户名" name="username">
          <Input disabled />
        </Form.Item>

        <Form.Item label="邮箱" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item label="头像">
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
            <Typography.Text type="secondary">当前头像</Typography.Text>
          </Space>
        </Form.Item>

        <Form.Item label="更换头像">
          <OSSUpload
            type="avatar"
            onChange={handleAvatarChange}
            value={user?.avatar}
            maxFileSize={2 * 1024 * 1024} // Limit to 2MB
            accept="image/jpeg,image/png,image/gif,image/webp"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
