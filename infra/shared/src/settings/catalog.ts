import { z } from 'zod';

// ============================================
// 平台参数配置（SystemSetting）—— 前后端共享的字段目录（ADR-008）
//
// key 与环境变量同名；读取优先级：数据库 SystemSetting → 环境变量 → 派生值。
// 元数据只定义在这里（SSOT），数据库只存 key/value/group/isSecret。
// 铁律：目录最小化——只收录 loom 已存在的 env 业务键，不投机扩展。
// ============================================

export type SettingFieldType = 'text' | 'secret' | 'textarea';

export interface SettingFieldDef {
  /** 与环境变量同名，如 LLM_API_KEY */
  key: string;
  label: string;
  type: SettingFieldType;
  /** 敏感值：接口脱敏、表单留空表示不修改 */
  isSecret: boolean;
  /** 可选配置：留空时有内置默认行为（配置页灰色显示，不计入缺失） */
  optional?: boolean;
  /** 仅展示的派生值（如由 PUBLIC_API_URL 生成的回调 URL），无需手填 */
  derivedOnly?: boolean;
  /** 枚举取值：配置后前端渲染为下拉选项而非输入框 */
  options?: { label: string; value: string }[];
  help?: string;
  placeholder?: string;
}

export interface SettingGroupDef {
  key: string;
  label: string;
  description: string;
  /** 第三方平台申请入口（外链） */
  guideLabel?: string;
  guideUrl?: string;
  fields: SettingFieldDef[];
}

/** 配置页脱敏视图契约（敏感值只回掩码，永不回明文） */
export interface SettingFieldView {
  key: string;
  label: string;
  type: SettingFieldType;
  isSecret: boolean;
  derivedOnly: boolean;
  isSet: boolean;
  source: 'db' | 'env' | 'derived' | 'none';
  value?: string;
  maskedValue?: string;
  options?: { label: string; value: string }[];
  help?: string;
  placeholder?: string;
}

export const SETTING_GROUPS: SettingGroupDef[] = [
  {
    key: 'base',
    label: '基础',
    description: '公网地址等基础参数（派生层的数据源，当前无派生项，预留）',
    fields: [
      {
        key: 'PUBLIC_API_URL',
        label: '公网 API 地址',
        type: 'text',
        isSecret: false,
        help: 'API 的公网 origin（https://api.example.com，不带 /api 后缀）；后续回调类 URL 将据此派生',
        placeholder: 'https://api.example.com',
        optional: true,
      },
    ],
  },
  {
    key: 'llm',
    label: 'AI 能力（LLM）',
    description: 'LLM 兜底配置（数据库无 isDefault LlmConfig 时的 env 链）与成本归因兜底单价',
    fields: [
      {
        key: 'LLM_API_URL',
        label: '兜底 API 地址',
        type: 'text',
        isSecret: false,
        help: 'OpenAI 兼容接口，仅当数据库无 isDefault 模型配置时生效',
        placeholder: 'https://api.deepseek.com/v1',
        optional: true,
      },
      { key: 'LLM_API_KEY', label: '兜底 API Key', type: 'secret', isSecret: true, optional: true },
      {
        key: 'LLM_MODEL',
        label: '兜底模型名',
        type: 'text',
        isSecret: false,
        placeholder: 'deepseek-chat',
        optional: true,
      },
      {
        key: 'LLM_INPUT_PRICE_PER_1M',
        label: '默认输入单价（元/百万 tokens）',
        type: 'text',
        isSecret: false,
        help: 'AI 用量看板成本归因的全局兜底；LlmConfig 行配置了单价则以行为准',
        optional: true,
      },
      {
        key: 'LLM_OUTPUT_PRICE_PER_1M',
        label: '默认输出单价（元/百万 tokens）',
        type: 'text',
        isSecret: false,
        help: '同上',
        optional: true,
      },
    ],
  },
  {
    key: 'automation',
    label: '自动化',
    description: '定时触发等自动化能力的灰度开关',
    fields: [
      {
        key: 'AGENT_TRIGGER_ENABLED',
        label: '启用 Agent 定时触发',
        type: 'text',
        isSecret: false,
        help: 'dispatcher 灰度总门：值为 true 时整点扫表执行到期触发器，其他值（含未设置）零动作',
        placeholder: 'true',
        optional: true,
        options: [
          { label: '启用（true）', value: 'true' },
          { label: '停用（false）', value: 'false' },
        ],
      },
    ],
  },
];

/** key 别名归一（读取时映射到目录键）——当前无别名，机制保留 */
export const SETTING_KEY_ALIASES: Record<string, string> = {};

/** 派生值生成器（由 PUBLIC_API_URL 生成回调 URL 等）——当前无派生项，机制保留 */
export const DERIVED_SETTINGS: Record<string, (baseUrl: string) => string> = {};

// ── tRPC 入参契约 ──

export const GetSettingGroupInputSchema = z.object({
  group: z.string().min(1),
});

export const SaveSettingGroupSchema = z.object({
  group: z.string().min(1),
  values: z.record(z.string(), z.string().nullable()),
});
