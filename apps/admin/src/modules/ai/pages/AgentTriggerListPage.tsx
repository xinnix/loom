import { Button, Popconfirm, Space, Tag, App } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';
import { AgentTriggerForm } from '../components/AgentTriggerForm';
import { Permission } from '@loom/shared';

/**
 * Agent 定时触发管理（ADR-009）。
 * 「立即执行」（runOnce，不动调度水位）与内置编辑/删除经
 * renderRowActions helpers 组合共存（批次 A 能力的消费场景）。
 */
export function AgentTriggerListPage() {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trpc = getTrpcClient() as any;

  const runOnce = useMutation({
    mutationFn: (id: string) => trpc.agentTriggers.runOnce.mutate({ id }),
    onSuccess: (res: any) => {
      message.success(`已触发（runId: ${res.runId}，状态 ${res.status}）`);
      queryClient.invalidateQueries({ queryKey: ['agentTriggers'] });
    },
    onError: (err: any) => message.error(err?.message ?? '触发失败'),
  });

  return (
    <StandardListPage
      resource="agentTriggers"
      title="Agent 定时触发"
      formComponent={AgentTriggerForm}
      searchFields={[{ field: 'name', placeholder: '搜索名称' }]}
      filterFields={[
        {
          field: 'enabled',
          type: 'select',
          options: [
            { value: 'true', label: '启用' },
            { value: 'false', label: '停用' },
          ],
        },
        {
          field: 'source',
          type: 'select',
          options: [
            { value: 'yml', label: 'YML 同步' },
            { value: 'manual', label: '手动创建' },
          ],
        },
      ]}
      permissions={{
        create: Permission.agentTrigger.create,
        update: Permission.agentTrigger.update,
        delete: Permission.agentTrigger.delete,
      }}
      columns={[
        { title: '名称', dataIndex: 'name', key: 'name' },
        {
          title: 'Agent',
          dataIndex: 'agentSlug',
          render: (v: string) => <Tag color="blue">{v}</Tag>,
        },
        { title: '调度', dataIndex: 'schedule', width: 130 },
        {
          title: '来源',
          dataIndex: 'source',
          width: 100,
          render: (v: string) => (
            <Tag color={v === 'yml' ? 'purple' : 'default'}>{v === 'yml' ? 'YML' : '手动'}</Tag>
          ),
        },
        {
          title: '状态',
          dataIndex: 'enabled',
          width: 80,
          render: (v: boolean) => (v ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>),
        },
        {
          title: '上次执行',
          dataIndex: 'lastRunAt',
          width: 170,
          render: (v: string | null) => (v ? new Date(v).toLocaleString('zh-CN') : '-'),
        },
        {
          title: '下次执行',
          dataIndex: 'nextRunAt',
          width: 170,
          render: (v: string | null) => (v ? new Date(v).toLocaleString('zh-CN') : '-'),
        },
      ]}
      renderRowActions={(record, helpers) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            loading={runOnce.isPending && runOnce.variables === record.id}
            onClick={() => runOnce.mutate(record.id as string)}
          >
            立即执行
          </Button>
          <Button type="link" size="small" onClick={() => helpers.edit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            onConfirm={() => {
              modal.confirm({
                title: `删除触发器「${record.name}」？`,
                content:
                  record.source === 'yml'
                    ? 'YML 同步的触发器删除后，下次重启会按 YML 重新创建；请直接在 YML 中移除 cron 配置。'
                    : undefined,
                onOk: () => helpers.delete(String(record.id)),
              });
            }}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
          <Button
            type="link"
            size="small"
            onClick={() => navigate('/ai/usage')}
            title="查看该 agent 的调用流水"
          >
            用量
          </Button>
        </Space>
      )}
    />
  );
}

export default AgentTriggerListPage;
