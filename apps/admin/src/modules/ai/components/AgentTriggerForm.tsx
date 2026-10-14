import { Select, Switch } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FieldDefinition } from '../../../shared/components/StandardForm';
import { StandardForm } from '../../../shared/components/StandardForm';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

/** 调度白名单选项（与 shared AgentTriggerScheduleSchema 同源形态） */
const SCHEDULE_OPTIONS = [
  { label: '每小时整点（HOURLY）', value: 'HOURLY' },
  ...Array.from({ length: 24 }, (_, h) => {
    const hh = String(h).padStart(2, '0');
    return { label: `每天 ${hh}:00（DAILY_${hh}）`, value: `DAILY_${hh}` };
  }),
];

/**
 * Agent 触发器表单（ADR-009）。运行输入 input 不在表单维护
 * （YML agent 输入经 API/YML 侧管理），表单只管调度节奏与启停。
 */
export const AgentTriggerForm: React.FC<any> = ({ form, isEdit }) => {
  const trpc = getTrpcClient() as any;
  const { data: slugs } = useQuery({
    queryKey: ['agentTriggers', 'slugs'],
    queryFn: () => trpc.agentTriggers.slugs.query(),
    enabled: !isEdit,
  });
  const slugOptions = useMemo(
    () => (Array.isArray(slugs) ? slugs.map((s: string) => ({ label: s, value: s })) : []),
    [slugs],
  );

  const fields: FieldDefinition[] = [
    {
      key: 'name',
      label: '名称',
      type: 'input',
      required: true,
      placeholder: '如「每日待办分析」',
    },
    {
      key: 'agentSlug',
      label: '目标 Agent',
      type: 'custom',
      render: (field: any, formInstance: any) => (
        <Select
          showSearch
          placeholder="选择 YML agent"
          options={slugOptions}
          disabled={isEdit}
          value={formInstance.getFieldValue(field.key)}
          onChange={(v) => formInstance.setFieldValue(field.key, v)}
        />
      ),
    },
    {
      key: 'schedule',
      label: '调度',
      type: 'custom',
      render: (field: any, formInstance: any) => (
        <Select
          placeholder="选择调度"
          options={SCHEDULE_OPTIONS}
          value={formInstance.getFieldValue(field.key)}
          onChange={(v) => formInstance.setFieldValue(field.key, v)}
        />
      ),
    },
    {
      key: 'enabled',
      label: '启用',
      type: 'custom',
      initialValue: true,
      render: (field: any, formInstance: any) => (
        <Switch
          checked={formInstance.getFieldValue(field.key) !== false}
          onChange={(v) => formInstance.setFieldValue(field.key, v)}
        />
      ),
    },
  ];

  return <StandardForm form={form} isEdit={isEdit} fields={fields} />;
};

export default AgentTriggerForm;
