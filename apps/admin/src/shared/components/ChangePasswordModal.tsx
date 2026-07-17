import { Modal, Form, Input, App } from 'antd';
import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getTrpcClient } from '../trpc/trpcClient';

interface ChangePasswordModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal = ({ visible, onCancel, onSuccess }: ChangePasswordModalProps) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (values: { oldPassword: string; newPassword: string }) => {
      const trpcClient = (await getTrpcClient()) as any;
      return trpcClient.auth.changePassword.mutate(values);
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleFinish = async (values: any) => {
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success('密码修改成功，请重新登录');
      form.resetFields();
      onSuccess();

      // Auto redirect to login page after 1.5s
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 1500);
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
    }
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="确认修改"
      cancelText="取消"
      confirmLoading={changePasswordMutation.isPending}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="旧密码"
          name="oldPassword"
          rules={[
            { required: true, message: '请输入旧密码' },
            { min: 1, message: '旧密码不能为空' },
          ]}
        >
          <Input.Password placeholder="请输入当前密码" />
        </Form.Item>

        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '新密码至少 8 个字符' },
            { max: 100, message: '新密码最多 100 个字符' },
          ]}
          hasFeedback
        >
          <Input.Password placeholder="请输入新密码（至少8位）" />
        </Form.Item>

        <Form.Item
          label="确认新密码"
          name="confirmPassword"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
