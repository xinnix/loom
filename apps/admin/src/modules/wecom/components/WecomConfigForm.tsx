import type { FieldDefinition } from '../../../shared/components/StandardForm/types';
import { StandardForm } from '../../../shared/components/StandardForm';
import type { FormInstance } from 'antd/es/form';

/**
 * 企业微信应用配置表单字段定义
 */
export const wecomConfigFormFields: FieldDefinition[] = [
  {
    key: 'name',
    label: '应用名称',
    type: 'input',
    required: true,
    placeholder: '例如：客服助手',
  },
  {
    key: 'corpId',
    label: '企业 ID (CorpId)',
    type: 'input',
    required: true,
    placeholder: '例如：ww1234567890abcdef',
  },
  {
    key: 'agentId',
    label: '应用 AgentId',
    type: 'number',
    required: true,
    placeholder: '例如：1000002',
    min: 1,
  },
  {
    key: 'secret',
    label: '应用 Secret',
    type: 'input',
    required: true,
    placeholder: '请输入 Secret',
    showOnlyInCreate: true,
  },
  {
    key: 'token',
    label: '回调 Token',
    type: 'input',
    required: true,
    placeholder: '在企业微信后台配置的 Token',
  },
  {
    key: 'encodingAESKey',
    label: 'EncodingAESKey',
    type: 'input',
    required: true,
    placeholder: '43个字符的 EncodingAESKey',
    maxLength: 43,
    rules: [{ len: 43, message: 'EncodingAESKey 必须为 43 个字符' }],
  },
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '应用描述（可选）',
  },
  {
    key: 'isActive',
    label: '启用',
    type: 'switch',
    initialValue: true,
  },
];

/**
 * 企业微信配置表单组件
 */
export function WecomConfigForm({ form, isEdit }: { form: FormInstance; isEdit: boolean }) {
  return <StandardForm form={form} isEdit={isEdit} fields={wecomConfigFormFields} />;
}
