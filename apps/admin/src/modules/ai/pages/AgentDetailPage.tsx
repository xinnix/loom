import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Typography, Spin } from 'antd';
import { useOne } from '@refinedev/core';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

const { Paragraph } = Typography;

/**
 * Agent 详情页：基础信息 + YML 编排定义只读视图 + 运行历史。
 */
export function AgentDetailPage() {
  const { id } = useParams();
  const { query } = useOne({ resource: 'agents', id });
  const record = query?.data?.data as any;

  const [yaml, setYaml] = useState<string | null>(null);
  const [runs, setRuns] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });

  useEffect(() => {
    if (!record?.slug) return;
    const trpc = getTrpcClient() as any;
    trpc.agents.getDefinition.query({ slug: record.slug }).then((r: any) => setYaml(r.yaml));
    trpc.agents.runs.query({ slug: record.slug, page: 1, limit: 10 }).then(setRuns);
  }, [record?.slug]);

  if (query?.isLoading) return <Spin />;
  if (!record) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title={record.name}>
        <Descriptions column={2}>
          <Descriptions.Item label="标识">
            <Tag color="geekblue">{record.slug}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={record.isActive ? 'green' : 'red'}>{record.isActive ? '启用' : '停用'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {record.description ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="默认模型配置">
            {record.llmConfig
              ? `${record.llmConfig.name}（${record.llmConfig.model}）`
              : '—（回退全局默认）'}
          </Descriptions.Item>
          <Descriptions.Item label="默认工具">
            {Array.isArray(record.tools) && record.tools.length > 0 ? record.tools.join(', ') : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="编排定义（YML，只读）">
        {yaml ? (
          <Paragraph>
            <pre
              style={{
                maxHeight: 400,
                overflow: 'auto',
                background: '#f6f6f6',
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {yaml}
            </pre>
          </Paragraph>
        ) : (
          <Spin size="small" />
        )}
      </Card>

      <Card title={`运行历史（${runs.total}）`}>
        <Table
          size="small"
          rowKey="id"
          dataSource={runs.items}
          pagination={{ pageSize: 5, total: runs.total }}
          columns={[
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (s: string) => (
                <Tag
                  color={
                    s === 'success'
                      ? 'green'
                      : s === 'failed'
                        ? 'red'
                        : s === 'truncated'
                          ? 'orange'
                          : 'blue'
                  }
                >
                  {s}
                </Tag>
              ),
            },
            {
              title: '输入',
              dataIndex: 'input',
              ellipsis: true,
              render: (v: unknown) => (
                <code style={{ fontSize: 11 }}>{JSON.stringify(v).slice(0, 80)}</code>
              ),
            },
            {
              title: '输出',
              dataIndex: 'output',
              ellipsis: true,
              render: (v: string | null) => v?.slice(0, 80) ?? '—',
            },
            {
              title: 'tokens',
              key: 'usage',
              width: 90,
              render: (_: unknown, r: any) => r.usage?.totalTokens ?? '—',
            },
            {
              title: '耗时',
              dataIndex: 'durationMs',
              width: 90,
              render: (v: number | null) => (v != null ? `${v}ms` : '—'),
            },
            {
              title: '时间',
              dataIndex: 'createdAt',
              width: 170,
              render: (v: string) => new Date(v).toLocaleString(),
            },
          ]}
        />
      </Card>
    </div>
  );
}
