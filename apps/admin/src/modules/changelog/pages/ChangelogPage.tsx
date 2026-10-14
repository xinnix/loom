import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Segmented, Space, Tag, Timeline, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

/**
 * 更新日志页（ADR-010）：渲染 CHANGELOG.md（文件真理源），
 * 类型筛选 + 关键字搜索（服务端过滤），Timeline 按版本倒序。
 */

const TYPE_META: Record<string, { label: string; color: string }> = {
  added: { label: '新增', color: 'green' },
  changed: { label: '变更', color: 'blue' },
  fixed: { label: '修复', color: 'orange' },
  removed: { label: '移除', color: 'red' },
  security: { label: '安全', color: 'purple' },
};

interface Group {
  type: string;
  items: string[];
}
interface Entry {
  version: string;
  date: string;
  groups: Group[];
}

export default function ChangelogPage() {
  const trpc = getTrpcClient() as any;
  const [type, setType] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<{ type?: string; keyword?: string }>({});

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['changelog', applied],
    queryFn: () =>
      trpc.changelog.getEntries.query({
        ...(applied.type && applied.type !== 'all' ? { type: applied.type } : {}),
        ...(applied.keyword ? { keyword: applied.keyword } : {}),
      }),
  });

  const entries: Entry[] = useMemo(() => data ?? [], [data]);

  const timelineItems = useMemo(
    () =>
      entries.map((entry) => ({
        key: entry.version,
        children: (
          <Card size="small" style={{ marginBottom: 8 }}>
            <Space size={12} align="center" style={{ marginBottom: entry.groups.length ? 8 : 0 }}>
              <Typography.Text strong style={{ fontSize: 15 }}>
                v{entry.version}
              </Typography.Text>
              <Typography.Text type="secondary">{entry.date}</Typography.Text>
            </Space>
            {entry.groups.map((g) => (
              <div key={g.type} style={{ marginBottom: 6 }}>
                <Tag color={TYPE_META[g.type]?.color ?? 'default'}>
                  {TYPE_META[g.type]?.label ?? g.type}
                </Tag>
                <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                  {g.items.map((item, i) => (
                    <li key={i} style={{ margin: '2px 0', lineHeight: 1.6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        ),
      })),
    [entries],
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Card
        title="更新日志"
        extra={
          <Space>
            <Segmented
              value={type}
              onChange={(v) => {
                setType(v as string);
                setApplied({ type: v as string, keyword: applied.keyword });
              }}
              options={[
                { label: '全部', value: 'all' },
                ...Object.entries(TYPE_META).map(([value, meta]) => ({
                  label: meta.label,
                  value,
                })),
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} />
          </Space>
        }
      >
        <Input.Search
          placeholder="搜索条目关键字"
          allowClear
          style={{ maxWidth: 320, marginBottom: 16 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(v) => setApplied({ type: applied.type, keyword: v })}
        />
        {isLoading ? (
          <Card loading style={{ border: 'none' }} />
        ) : timelineItems.length === 0 ? (
          <Empty description="没有匹配的变更记录" />
        ) : (
          <Timeline items={timelineItems} />
        )}
      </Card>
    </div>
  );
}
