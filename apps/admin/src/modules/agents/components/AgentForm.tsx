import { Form, Input, Switch, InputNumber, Select, Slider } from 'antd';

interface AgentFormProps {
  form: any;
  isEdit?: boolean;
}

export const AgentForm = ({ form, isEdit = false }: AgentFormProps) => {
  return (
    <Form form={form} layout="vertical">
      <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
        <Input placeholder="例如：客服助手" />
      </Form.Item>

      <Form.Item name="slug" label="标识" rules={[{ required: true, message: '请输入标识' }]}>
        <Input placeholder="例如：customer-service" disabled={isEdit} />
      </Form.Item>

      <Form.Item name="description" label="描述">
        <Input.TextArea placeholder="Agent 功能描述" rows={2} />
      </Form.Item>

      <Form.Item name="icon" label="图标">
        <Input placeholder="图标名称或 URL" />
      </Form.Item>

      <Form.Item name="model" label="模型" rules={[{ required: true, message: '请选择模型' }]}>
        <Select
          placeholder="选择 LLM 模型"
          options={[
            { label: 'GPT-4o', value: 'gpt-4o' },
            { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
            { label: 'Claude Sonnet 4 (20250514)', value: 'claude-sonnet-4-20250514' },
            { label: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-latest' },
            { label: 'DeepSeek V3', value: 'deepseek-chat' },
            { label: 'Qwen Max', value: 'qwen-max' },
            { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
          ]}
        />
      </Form.Item>

      <Form.Item name="systemPrompt" label="系统提示词（System Prompt）">
        <Input.TextArea placeholder="设置 AI 的角色和行为指令" rows={3} />
      </Form.Item>

      <Form.Item name="temperature" label="温度（Temperature: 0-2）">
        <Slider min={0} max={2} step={0.1} marks={{ 0: '精确', 1: '平衡', 2: '创意' }} />
      </Form.Item>

      <Form.Item name="maxTokens" label="最大输出 Token">
        <InputNumber min={1} max={128000} placeholder="4096" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="provider" label="提供商">
        <Select
          placeholder="选择 AI 提供商"
          options={[
            { label: 'OpenAI 兼容', value: 'openai' },
            { label: 'Anthropic', value: 'anthropic' },
            { label: '自定义', value: 'custom' },
          ]}
        />
      </Form.Item>

      <Form.Item name="apiUrl" label="API 地址（可选，覆盖全局配置）">
        <Input placeholder="https://api.openai.com/v1" />
      </Form.Item>

      <Form.Item
        name="apiKey"
        label="API Key（可选，覆盖全局配置）"
        rules={[{ required: !isEdit, message: '首次创建需输入 API Key' }]}
      >
        <Input.Password placeholder={isEdit ? '留空则不修改' : '请输入 API Key'} />
      </Form.Item>

      <Form.Item name="sort" label="排序">
        <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="isActive" label="启用" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Form>
  );
};
