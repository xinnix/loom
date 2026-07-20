import { Slider, Input } from 'antd';
import type { FieldDefinition } from '../../../shared/components/StandardForm/types';
import { StandardForm } from '../../../shared/components/StandardForm';
import type { FormInstance } from 'antd/es/form';

/**
 * Agent 模型选项
 */
export const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (20250514)' },
  { value: 'claude-3-5-haiku-latest', label: 'Claude Haiku 3.5' },
  { value: 'deepseek-chat', label: 'DeepSeek V3' },
  { value: 'qwen-max', label: 'Qwen Max' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

/**
 * Agent 提供商选项
 */
export const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI 兼容' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'custom', label: '自定义' },
];

/**
 * 提供商标签颜色映射
 */
export const PROVIDER_COLORS: Record<string, string> = {
  openai: 'green',
  anthropic: 'purple',
  custom: 'default',
};

/**
 * Agent 表单字段定义
 */
export const agentFormFields: FieldDefinition[] = [
  {
    key: 'name',
    label: '名称',
    type: 'input',
    required: true,
    placeholder: '例如：客服助手',
  },
  {
    key: 'slug',
    label: '标识',
    type: 'input',
    required: true,
    placeholder: '例如：customer-service',
    showOnlyInCreate: true,
  },
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: 'Agent 功能描述',
  },
  {
    key: 'icon',
    label: '图标',
    type: 'input',
    placeholder: '图标名称或 URL',
  },
  {
    key: 'model',
    label: '模型',
    type: 'select',
    required: true,
    initialValue: 'gpt-4o',
    options: MODEL_OPTIONS,
  },
  {
    key: 'systemPrompt',
    label: '系统提示词（System Prompt）',
    type: 'textarea',
    placeholder: '设置 AI 的角色和行为指令',
  },
  {
    key: 'temperature',
    label: '温度（Temperature）',
    type: 'custom',
    tooltip: '0=精确, 1=平衡, 2=创意',
    render: () => <Slider min={0} max={2} step={0.1} marks={{ 0: '精确', 1: '平衡', 2: '创意' }} />,
  },
  {
    key: 'maxTokens',
    label: '最大输出 Token',
    type: 'number',
    min: 1,
    max: 128000,
    placeholder: '4096',
  },
  {
    key: 'provider',
    label: '提供商',
    type: 'select',
    initialValue: 'openai',
    options: PROVIDER_OPTIONS,
  },
  {
    key: 'apiUrl',
    label: 'API 地址',
    type: 'input',
    placeholder: 'https://api.openai.com/v1（可选，覆盖全局配置）',
  },
  // 创建时：API Key 必填
  {
    key: 'apiKey',
    label: 'API Key',
    type: 'custom',
    showOnlyInCreate: true,
    required: true,
    render: () => <Input.Password placeholder="请输入 API Key" />,
  },
  // 编辑时：API Key 可选（留空不修改）
  {
    key: 'apiKey',
    label: 'API Key',
    type: 'custom',
    showOnlyInEdit: true,
    render: () => <Input.Password placeholder="留空则不修改" />,
  },
  {
    key: 'sort',
    label: '排序',
    type: 'number',
    initialValue: 0,
    min: 0,
  },
  {
    key: 'isActive',
    label: '启用',
    type: 'switch',
    valuePropName: 'checked',
    initialValue: true,
  },
];

/**
 * StandardForm 模式：声明式表单组件
 */
export function AgentForm({ form, isEdit }: { form: FormInstance; isEdit: boolean }) {
  return <StandardForm form={form} isEdit={isEdit} fields={agentFormFields} />;
}
