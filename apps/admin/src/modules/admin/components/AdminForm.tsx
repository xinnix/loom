import type { FieldDefinition } from '../../../shared/components/StandardForm/types';
import { StandardForm } from '../../../shared/components/StandardForm';
import type { FormInstance } from 'antd/es/form';

/**
 * Admin 表单字段定义
 */
export const adminFormFields: FieldDefinition[] = [
  {
    key: 'username',
    label: '用户名',
    type: 'input',
    required: true,
    placeholder: '请输入用户名',
    maxLength: 50,
  },
  {
    key: 'email',
    label: '邮箱',
    type: 'input',
    required: true,
    placeholder: '请输入邮箱',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  {
    key: 'password',
    label: '密码',
    type: 'input',
    required: true,
    placeholder: '请输入密码（至少 8 个字符）',
    showOnlyInCreate: true,
    rules: [{ min: 8, message: '密码至少 8 个字符' }],
  },
  {
    key: 'firstName',
    label: '名',
    type: 'input',
    placeholder: '请输入名',
  },
  {
    key: 'lastName',
    label: '姓',
    type: 'input',
    placeholder: '请输入姓',
  },
  {
    key: 'isActive',
    label: '启用状态',
    type: 'switch',
    initialValue: true,
  },
];

/**
 * Admin 表单组件
 */
export function AdminForm({ form, isEdit }: { form: FormInstance; isEdit: boolean }) {
  return <StandardForm form={form} isEdit={isEdit} fields={adminFormFields} />;
}
