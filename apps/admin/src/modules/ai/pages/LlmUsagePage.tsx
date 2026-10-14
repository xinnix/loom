import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Col,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  Input,
  Select,
  Button,
  Drawer,
  Descriptions,
  Tooltip,
} from 'antd';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

/**
 * AI 用量看板（ADR-007，移植自 weSale 并按 loom 场景改写）：
 * - 总览：7/14/30 天四维透视（总览/趋势/场景=agent/模型）+ 单价成本归因
 * - 明细：LlmCallLog 流水查询 + Drawer 详情；「查看配置」深链复用
 *   StandardListPage.autoOpenEditParam（批次 A 能力）
 */

const STATUS_OPTIONS = [
  { value: 'SUCCESS', label: '成功' },
  { value: 'ERROR', label: '错误' },
  { value: 'TIMEOUT', label: '超时' },
  { value: 'ABORTED', label: '中止' },
];

const CALL_TYPE_LABELS: Record<string, string> = {
  CHAT: '单次调用',
  CHAT_STREAM: '流式调用',
  AGENT_LOOP: '工具循环(单轮)',
};

function statusTag(status: string) {
  const color =
    status === 'SUCCESS'
      ? 'green'
      : status === 'ERROR'
        ? 'red'
        : status === 'TIMEOUT'
          ? 'orange'
          : 'default';
  return <Tag color={color}>{STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}</Tag>;
}

function fmtTokens(n?: number | null): string {
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** 总览 Tab：统计卡 + 趋势图 + 场景/模型维度表 */
function UsageOverview() {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const trpc = getTrpcClient() as any;
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['llmUsage', 'overview', days],
    queryFn: () => trpc.llmUsage.getOverview.query({ days }),
    refetchInterval: 60_000,
  });

  const totals = data?.totals;
  const trend = (data?.trend ?? []).map((t: any) => ({
    ...t,
    costLabel: t.cost ? `¥${t.cost}` : '¥0',
  }));

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Row justify="space-between" align="middle">
        <Segmented
          value={days}
          onChange={(v) => setDays(v as 7 | 14 | 30)}
          options={[
            { label: '近 7 天', value: 7 },
            { label: '近 14 天', value: 14 },
            { label: '近 30 天', value: 30 },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          刷新
        </Button>
      </Row>

      <Row gutter={16}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="总调用" value={totals?.calls ?? 0} loading={isLoading} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="错误率"
              value={totals ? (totals.errorRate * 100).toFixed(2) : '0'}
              suffix="%"
              valueStyle={{ color: (totals?.errorRate ?? 0) > 0.05 ? '#cf1322' : undefined }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="输入 tokens"
              value={fmtTokens(totals?.inputTokens)}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="输出 tokens"
              value={fmtTokens(totals?.outputTokens)}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="成本归因（单价未配则按估算）"
              value={`¥${totals?.cost ?? 0}`}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="延迟 P50 / P95"
              value={
                totals?.latencyP50 != null
                  ? `${totals.latencyP50} / ${totals.latencyP95 ?? '-'}`
                  : '-'
              }
              suffix="ms"
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="调用与成本趋势">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="calls" />
            <YAxis yAxisId="cost" orientation="right" />
            <Legend />
            <Bar yAxisId="calls" dataKey="calls" name="调用次数" fill="#1677ff" />
            <Bar yAxisId="calls" dataKey="errorCalls" name="错误次数" fill="#cf1322" />
            <Line yAxisId="cost" dataKey="cost" name="成本(元)" stroke="#faad14" />
            <Tooltip />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="场景维度（agent）">
            <Table
              rowKey={(r: any) => r.sceneKey ?? 'unattributed'}
              size="small"
              loading={isLoading}
              dataSource={data?.byScene ?? []}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              columns={[
                {
                  title: '场景',
                  dataIndex: 'sceneKey',
                  render: (v: string | null) =>
                    v ? <Tag color="blue">{v}</Tag> : <Tag>未归因</Tag>,
                },
                { title: '调用', dataIndex: 'calls', width: 70 },
                {
                  title: '错误',
                  dataIndex: 'errorCalls',
                  width: 70,
                  render: (v: number) =>
                    v > 0 ? <span style={{ color: '#cf1322' }}>{v}</span> : v,
                },
                { title: '输入', dataIndex: 'inputTokens', width: 80, render: fmtTokens },
                { title: '输出', dataIndex: 'outputTokens', width: 80, render: fmtTokens },
                { title: '成本(元)', dataIndex: 'cost', width: 90 },
                {
                  title: '均延迟',
                  dataIndex: 'latencyAvg',
                  width: 80,
                  render: (v: number | null) => (v != null ? `${v}ms` : '-'),
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="模型维度">
            <Table
              rowKey="model"
              size="small"
              loading={isLoading}
              dataSource={data?.byModel ?? []}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              columns={[
                { title: '模型', dataIndex: 'model' },
                { title: '调用', dataIndex: 'calls', width: 70 },
                { title: '输入', dataIndex: 'inputTokens', width: 80, render: fmtTokens },
                { title: '输出', dataIndex: 'outputTokens', width: 80, render: fmtTokens },
                { title: '成本(元)', dataIndex: 'cost', width: 90 },
                {
                  title: '均延迟',
                  dataIndex: 'latencyAvg',
                  width: 80,
                  render: (v: number | null) => (v != null ? `${v}ms` : '-'),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

interface LogRow {
  id: string;
  traceId: string;
  sceneKey: string | null;
  callType: string;
  model: string;
  llmConfigId: string | null;
  status: string;
  inputTokens: number | null;
  outputTokens: number | null;
  promptChars: number | null;
  completionChars: number | null;
  latencyMs: number | null;
  errorClass: string | null;
  errorMsg: string | null;
  day: string;
  props: Record<string, unknown> | null;
  createdAt: string;
}

/** 明细 Tab：筛选 + 分页表 + Drawer 详情 */
function UsageLogs() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    sceneKey?: string;
    status?: string;
    model?: string;
    traceId?: string;
  }>({});
  const [input, setInput] = useState(filters);
  const [detail, setDetail] = useState<LogRow | null>(null);
  const trpc = getTrpcClient() as any;

  const { data, isLoading } = useQuery({
    queryKey: ['llmUsage', 'logs', page, filters],
    queryFn: () => trpc.llmUsage.getLogs.query({ page, pageSize: 20, ...filters }),
  });

  const applyFilters = useCallback(() => {
    setPage(1);
    const cleaned = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v != null && v !== ''),
    );
    setFilters(cleaned);
  }, [input]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Space wrap>
        <Input
          placeholder="场景（agent slug）"
          style={{ width: 180 }}
          value={input.sceneKey}
          onChange={(e) => setInput({ ...input, sceneKey: e.target.value })}
          onPressEnter={applyFilters}
          allowClear
        />
        <Select
          placeholder="状态"
          style={{ width: 120 }}
          allowClear
          options={STATUS_OPTIONS}
          value={input.status}
          onChange={(v) => setInput({ ...input, status: v })}
        />
        <Input
          placeholder="模型（包含）"
          style={{ width: 180 }}
          value={input.model}
          onChange={(e) => setInput({ ...input, model: e.target.value })}
          onPressEnter={applyFilters}
          allowClear
        />
        <Input
          placeholder="traceId（= runId）"
          style={{ width: 220 }}
          value={input.traceId}
          onChange={(e) => setInput({ ...input, traceId: e.target.value })}
          onPressEnter={applyFilters}
          allowClear
        />
        <Button type="primary" onClick={applyFilters}>
          查询
        </Button>
      </Space>

      <Table<LogRow>
        rowKey="id"
        size="small"
        loading={isLoading}
        dataSource={data?.items ?? []}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage,
        }}
        columns={[
          {
            title: '时间',
            dataIndex: 'createdAt',
            width: 170,
            render: (v: string) => new Date(v).toLocaleString('zh-CN'),
          },
          {
            title: '场景',
            dataIndex: 'sceneKey',
            width: 130,
            render: (v: string | null) => v ?? '-',
          },
          {
            title: '类型',
            dataIndex: 'callType',
            width: 120,
            render: (v: string) => CALL_TYPE_LABELS[v] ?? v,
          },
          { title: '模型', dataIndex: 'model', width: 140 },
          { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
          { title: '输入', dataIndex: 'inputTokens', width: 80, render: fmtTokens },
          { title: '输出', dataIndex: 'outputTokens', width: 80, render: fmtTokens },
          {
            title: '延迟',
            dataIndex: 'latencyMs',
            width: 90,
            render: (v: number | null) => (v != null ? `${v}ms` : '-'),
          },
          {
            title: '操作',
            key: 'actions',
            width: 80,
            render: (_, record) => (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setDetail(record)}
              >
                详情
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title="调用详情"
        width={520}
        open={!!detail}
        onClose={() => setDetail(null)}
        destroyOnClose
      >
        {detail && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="traceId（= runId）">
                <Typography.Text copyable style={{ fontFamily: 'monospace' }}>
                  {detail.traceId}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="场景">{detail.sceneKey ?? '未归因'}</Descriptions.Item>
              <Descriptions.Item label="类型">
                {CALL_TYPE_LABELS[detail.callType] ?? detail.callType}
              </Descriptions.Item>
              <Descriptions.Item label="模型">{detail.model}</Descriptions.Item>
              <Descriptions.Item label="状态">{statusTag(detail.status)}</Descriptions.Item>
              <Descriptions.Item label="tokens">
                输入 {fmtTokens(detail.inputTokens)} / 输出 {fmtTokens(detail.outputTokens)}
                （chars: {detail.promptChars ?? '-'} / {detail.completionChars ?? '-'}）
              </Descriptions.Item>
              <Descriptions.Item label="延迟">
                {detail.latencyMs != null ? `${detail.latencyMs}ms` : '-'}
              </Descriptions.Item>
              {detail.errorClass && (
                <Descriptions.Item label="错误分类">
                  <Tag color="red">{detail.errorClass}</Tag>
                  {detail.errorMsg}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="日桶">{detail.day}</Descriptions.Item>
            </Descriptions>
            {detail.llmConfigId && (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => navigate(`/ai/llm-configs?id=${detail.llmConfigId}`)}
              >
                查看模型配置（深链编辑）→
              </Button>
            )}
            {detail.props && (
              <Card size="small" title="扩展元数据">
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {JSON.stringify(detail.props, null, 2)}
                </pre>
              </Card>
            )}
          </Space>
        )}
      </Drawer>
    </Space>
  );
}

export default function LlmUsagePage() {
  // 预热 tRPC client（动态 import 已在 trpcClient 单例内完成）
  useEffect(() => {
    void getTrpcClient();
  }, []);

  const items = useMemo(
    () => [
      { key: 'overview', label: '总览', children: <UsageOverview /> },
      { key: 'logs', label: '明细', children: <UsageLogs /> },
    ],
    [],
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Card>
        <Tabs defaultActiveKey="overview" items={items} />
      </Card>
    </div>
  );
}
