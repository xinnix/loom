import { Input, Slider, Switch, Tag } from 'antd';
import type { FieldDefinition } from '../../../shared/components/StandardForm/types';

/** MVP 支持的 provider（pi openai-completions 适配一切兼容端点） */
export const PROVIDER_OPTIONS = [{ value: 'openai', label: 'OpenAI 兼容' }];

export const PROVIDER_COLORS: Record<string, string> = { openai: 'green' };

/** 常用模型建议（自由输入，不做硬校验） */
export const MODEL_SUGGESTIONS = [
  'gpt-4o',
  'gpt-4o-mini',
  'deepseek-chat',
  'deepseek-reasoner',
  'qwen-max',
  'claude-sonnet-4-20250514',
  'gemini-2.0-flash',
];

/** LlmConfig 表单字段（AI 第 1 层管理） */
export const llmConfigFormFields: FieldDefinition[] = [
  {
    key: 'name',
    label: '显示名',
    type: 'input',
    required: true,
    placeholder: '例如：DeepSeek 生产',
  },
  {
    key: 'configKey',
    label: '配置键',
    type: 'input',
    required: true,
    showOnlyInCreate: true,
    placeholder: '小写字母/数字/横杠，YML 节点 llm: configKey 引用',
    rules: [{ pattern: /^[a-z0-9][a-z0-9-]*$/, message: '仅限小写字母/数字/横杠' }],
  },
  {
    key: 'provider',
    label: 'Provider',
    type: 'select',
    initialValue: 'openai',
    options: PROVIDER_OPTIONS,
  },
  {
    key: 'apiUrl',
    label: 'API 地址',
    type: 'input',
    placeholder: 'https://api.openai.com/v1（或 DeepSeek/Qwen/vLLM 等兼容端点）',
  },
  {
    key: 'model',
    label: '模型',
    type: 'custom',
    required: true,
    render: (field, form) => (
      <>
        <Input.Search
          placeholder="模型名，如 deepseek-chat"
          value={form.getFieldValue(field.key)}
          onChange={(e) => form.setFieldValue(field.key, e.target.value)}
          style={{ maxWidth: 480 }}
        />
        <div style={{ marginTop: 8 }}>
          {MODEL_SUGGESTIONS.map((m) => (
            <Tag
              key={m}
              style={{ cursor: 'pointer' }}
              onClick={() => form.setFieldValue(field.key, m)}
            >
              {m}
            </Tag>
          ))}
        </div>
      </>
    ),
  },
  {
    key: 'apiKey',
    label: 'API Key',
    type: 'custom',
    render: (field, form) => (
      <Input.Password
        placeholder="sk-...（编辑时留空 = 不修改）"
        value={form.getFieldValue(field.key) ?? ''}
        onChange={(e) => form.setFieldValue(field.key, e.target.value)}
        autoComplete="new-password"
      />
    ),
  },
  {
    key: 'temperature',
    label: 'Temperature',
    type: 'custom',
    render: (field, form) => (
      <Slider
        min={0}
        max={2}
        step={0.1}
        value={form.getFieldValue(field.key) ?? 0.7}
        onChange={(v) => form.setFieldValue(field.key, v)}
        style={{ maxWidth: 320 }}
      />
    ),
  },
  {
    key: 'maxTokens',
    label: 'Max Tokens',
    type: 'number',
    placeholder: '留空使用模型默认',
  },
  {
    key: 'timeoutMs',
    label: '超时（ms）',
    type: 'number',
    initialValue: 60000,
  },
  {
    key: 'maxRetries',
    label: '重试次数',
    type: 'number',
    initialValue: 1,
  },
  {
    key: 'isDefault',
    label: '全局默认',
    type: 'switch',
    render: (field, form) => (
      <Switch
        checked={!!form.getFieldValue(field.key)}
        onChange={(v) => form.setFieldValue(field.key, v)}
      />
    ),
  },
  {
    key: 'isActive',
    label: '启用',
    type: 'switch',
    initialValue: true,
    render: (field, form) => (
      <Switch
        checked={form.getFieldValue(field.key) !== false}
        onChange={(v) => form.setFieldValue(field.key, v)}
      />
    ),
  },
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
  },
];

import { StandardForm } from '../../../shared/components/StandardForm';
import type { FormInstance } from 'antd/es/form';

interface LlmConfigFormProps {
  form: FormInstance;
  isEdit: boolean;
}

/** LlmConfig 创建/编辑表单（StandardForm 声明式驱动） */
export function LlmConfigForm({ form, isEdit }: LlmConfigFormProps) {
  return <StandardForm form={form} isEdit={isEdit} fields={llmConfigFormFields} />;
}
