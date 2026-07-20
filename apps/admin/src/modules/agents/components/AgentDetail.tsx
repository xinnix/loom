import { Tag } from 'antd';
import { PROVIDER_COLORS } from './AgentForm';
import type { DetailFieldConfig } from '../../../shared/components/StandardDetailPage/types';

/**
 * Agent 详情字段配置
 */
export const agentDetailFields: DetailFieldConfig[] = [
  { key: 'name', label: '名称', type: 'text' },
  { key: 'slug', label: '标识', type: 'text' },
  {
    key: 'description',
    label: '描述',
    type: 'text',
    showCondition: (entity: any) => !!entity.description,
  },
  { key: 'icon', label: '图标', type: 'text', showCondition: (entity: any) => !!entity.icon },
  { key: 'model', label: '模型', type: 'text' },
  {
    key: 'systemPrompt',
    label: '系统提示词',
    type: 'text',
    showCondition: (entity: any) => !!entity.systemPrompt,
  },
  {
    key: 'temperature',
    label: '温度',
    type: 'number',
    showCondition: (entity: any) => entity.temperature !== null && entity.temperature !== undefined,
  },
  {
    key: 'maxTokens',
    label: '最大输出 Token',
    type: 'number',
    showCondition: (entity: any) => entity.maxTokens !== null && entity.maxTokens !== undefined,
  },
  {
    key: 'provider',
    label: '提供商',
    type: 'custom',
    render: (_val: any, entity: any) => (
      <Tag color={PROVIDER_COLORS[entity.provider] || 'default'}>{entity.provider}</Tag>
    ),
  },
  {
    key: 'apiUrl',
    label: 'API 地址',
    type: 'url',
    showCondition: (entity: any) => !!entity.apiUrl,
  },
  {
    key: 'apiKey',
    label: 'API Key',
    type: 'custom',
    render: () => '••••••••',
  },
  {
    key: 'sort',
    label: '排序',
    type: 'number',
  },
  {
    key: 'isActive',
    label: '状态',
    type: 'boolean',
    booleanLabels: ['禁用', '启用'],
    booleanColors: ['red', 'green'],
  },
  {
    key: 'createdAt',
    label: '创建时间',
    type: 'datetime',
  },
  {
    key: 'updatedAt',
    label: '更新时间',
    type: 'datetime',
  },
];
