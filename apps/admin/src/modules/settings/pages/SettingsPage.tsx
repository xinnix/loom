import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  Space,
  Tabs,
  Tag,
  Typography,
  App as AntApp,
  Select,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

/**
 * 平台参数配置页（ADR-008，移植自 weSale 按最小目录改写）：
 * 分组 Tab + 目录驱动表单；敏感值只显掩码、留空 = 不修改。
 */

const SOURCE_LABELS: Record<string, { text: string; color: string }> = {
  db: { text: '数据库', color: 'green' },
  env: { text: '环境变量', color: 'blue' },
  derived: { text: '派生', color: 'purple' },
  none: { text: '未设置', color: 'default' },
};

interface FieldView {
  key: string;
  label: string;
  type: 'text' | 'secret' | 'textarea';
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

function GroupForm({ group }: { group: string }) {
  const trpc = getTrpcClient() as any;
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'group', group],
    queryFn: () => trpc.settings.getGroup.query({ group }),
  });

  const save = useMutation({
    mutationFn: (values: Record<string, string>) =>
      trpc.settings.saveGroup.mutate({ group, values }),
    onSuccess: () => {
      message.success('配置已保存');
      queryClient.invalidateQueries({ queryKey: ['settings', 'group', group] });
      form.resetFields();
    },
    onError: (err: any) => message.error(err?.message ?? '保存失败'),
  });

  const fields: FieldView[] = useMemo(() => data?.fields ?? [], [data]);

  useEffect(() => {
    // 非敏感且已设置的值预填；敏感值留空（= 不修改），展示掩码
    const initial: Record<string, string> = {};
    for (const f of fields) {
      if (!f.isSecret && !f.derivedOnly && f.isSet && f.value) initial[f.key] = f.value;
    }
    form.setFieldsValue(initial);
  }, [fields, form]);

  if (isLoading) return <Card loading />;

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
      {fields.map((f) => (
        <Form.Item
          key={f.key}
          label={
            <Space size={8}>
              <span>{f.label}</span>
              <Tag color={SOURCE_LABELS[f.source]?.color}>{SOURCE_LABELS[f.source]?.text}</Tag>
              {f.isSet && f.isSecret && f.maskedValue && (
                <Typography.Text code type="secondary">
                  {f.maskedValue}
                </Typography.Text>
              )}
              {f.optional && <Typography.Text type="secondary">可选</Typography.Text>}
            </Space>
          }
          extra={f.help}
          name={f.key}
        >
          {f.derivedOnly ? (
            <Input disabled placeholder="由基础配置派生" />
          ) : f.options?.length ? (
            <Select options={f.options} placeholder={f.placeholder} allowClear />
          ) : f.type === 'textarea' ? (
            <Input.TextArea rows={3} placeholder={f.placeholder} />
          ) : f.isSecret ? (
            <Input.Password
              placeholder={f.isSet ? '留空 = 不修改' : (f.placeholder ?? '未设置')}
              autoComplete="new-password"
            />
          ) : (
            <Input placeholder={f.placeholder ?? '未设置'} />
          )}
        </Form.Item>
      ))}
      <Form.Item>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={save.isPending}
          onClick={async () => {
            const values = await form.validateFields();
            save.mutate(values);
          }}
        >
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}

export default function SettingsPage() {
  const trpc = getTrpcClient() as any;
  const { data } = useQuery({
    queryKey: ['settings', 'groups'],
    queryFn: () => trpc.settings.groups.query(),
  });

  const items = useMemo(
    () =>
      (data ?? []).map((g: any) => ({
        key: g.key,
        label: g.label,
        children: <GroupForm group={g.key} />,
      })),
    [data],
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Card title="平台参数">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          数据库配置优先于环境变量；敏感值脱敏展示，留空保存 = 不修改。
        </Typography.Paragraph>
        <Tabs items={items} />
      </Card>
    </div>
  );
}
