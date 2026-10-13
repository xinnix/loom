import { useCallback, useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Popover, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';
import type { ToolParameterSchema } from '@loom/shared';

const { Paragraph } = Typography;

/**
 * AI 工具列表（只读）。
 * 例外说明：数据源是 ToolRegistry（YML 真理源的内存对象），非 Refine/Prisma
 * 资源——不适合 StandardListPage（其数据流绑定 dataProvider CRUD 约定），
 * 故用轻量 Table 直调 tRPC。
 */
export function ToolListPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const trpc = getTrpcClient() as any;
    trpc.aiTools.list
      .query()
      .then(setTools)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const renderParams = (params: ToolParameterSchema) => (
    <pre style={{ fontSize: 11, margin: 0, maxWidth: 420, whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(params, null, 2)}
    </pre>
  );

  return (
    <Card
      title="AI 工具"
      extra={
        <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
          刷新
        </Button>
      }
    >
      <Paragraph type="secondary" style={{ marginTop: 0 }}>
        工具由 <code>apps/api/src/ai/definitions/tools/*.yml</code> 声明（YML 为真理源），
        映射系统内部 REST 端点；修改需编辑 YML 并重启（dev 下热加载）。
      </Paragraph>
      <Table
        rowKey="name"
        size="small"
        loading={loading}
        dataSource={tools}
        pagination={false}
        columns={[
          {
            title: '名称',
            dataIndex: 'name',
            width: 150,
            render: (v: string) => <Tag color="geekblue">{v}</Tag>,
          },
          { title: '描述', dataIndex: 'description', ellipsis: true },
          {
            title: '权限',
            dataIndex: 'permission',
            width: 130,
            render: (v: string | undefined) =>
              v ? <Tag color="orange">{v}</Tag> : <Tag>任意认证用户</Tag>,
          },
          {
            title: 'REST 映射',
            key: 'rest',
            width: 220,
            render: (_: unknown, r: any) => (
              <code style={{ fontSize: 11 }}>
                {r.rest?.method} {r.rest?.path}
              </code>
            ),
          },
          {
            title: '参数 Schema',
            dataIndex: 'parameters',
            width: 120,
            render: (v: ToolParameterSchema) =>
              v ? (
                <Popover content={renderParams(v)} trigger="click">
                  <Button size="small" type="link">
                    查看
                  </Button>
                </Popover>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </Card>
  );
}
