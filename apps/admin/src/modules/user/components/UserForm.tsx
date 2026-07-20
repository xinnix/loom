import { Form, Input, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import type { FieldDefinition } from '../../../shared/components/StandardForm/types';
import { StandardForm } from '../../../shared/components/StandardForm';
import type { FormInstance } from 'antd/es/form';

/**
 * User 表单字段定义
 *
 * 当前 Admin 端用户管理为只读模式（用户通过微信登录自动创建），
 * 此表单定义为将来需要时的参考实现。
 */
export const userFormFields: FieldDefinition[] = [
  {
    key: 'username',
    label: '用户名',
    type: 'input',
    required: true,
    placeholder: '请输入用户名',
  },
  {
    key: 'email',
    label: '邮箱',
    type: 'input',
    required: true,
    placeholder: '请输入邮箱',
    rules: [{ type: 'email' as any, message: '邮箱格式不正确' }],
  },
  {
    key: 'nickname',
    label: '昵称',
    type: 'input',
    placeholder: '请输入昵称',
  },
  {
    key: 'phone',
    label: '手机号',
    type: 'input',
    placeholder: '请输入手机号',
  },
  {
    key: 'password',
    label: '密码',
    type: 'custom',
    showOnlyInCreate: true,
    required: true,
    render: () => <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />,
  },
];

/**
 * StandardForm 模式：声明式表单组件
 */
export function UserForm({ form, isEdit }: { form: FormInstance; isEdit: boolean }) {
  return <StandardForm form={form} isEdit={isEdit} fields={userFormFields} />;
}
