import { useTable } from '@refinedev/core';
import { List } from '@refinedev/antd';
import { Table, Card, Row, Col, Tag, Input, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface WecomMessage {
  id: string;
  configId: string;
  direction: string;
  msgType: string;
  fromUser?: string;
  toUser?: string;
  content?: string;
  createdAt: Date;
  config?: { name: string };
}

export const WecomMessageListPage = () => {
  const [searchText, setSearchText] = useState('');
  const [contentModal, setContentModal] = useState<{ open: boolean; content: string }>({
    open: false,
    content: '',
  });

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } = useTable<WecomMessage>(
    {
      resource: 'wecom.message',
      pagination: { currentPage: 1, pageSize: 20, mode: 'server' },
      filters: {
        initial: searchText
          ? [{ field: 'search', operator: 'contains', value: searchText } as any]
          : [],
      },
    },
  );

  const result = tableQuery.data;

  const directionMap: Record<string, { color: string; label: string }> = {
    received: { color: 'blue', label: '收到' },
    sent: { color: 'green', label: '发送' },
  };

  const columns: any[] = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '配置',
      dataIndex: ['config', 'name'],
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 80,
      render: (dir: string) => {
        const info = directionMap[dir] || { color: 'default', label: dir };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '消息类型',
      dataIndex: 'msgType',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '发送者',
      dataIndex: 'fromUser',
      width: 120,
      render: (user: string) => user || '-',
    },
    {
      title: '接收者',
      dataIndex: 'toUser',
      width: 120,
      render: (user: string) => user || '-',
    },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (content: string) => {
        if (!content) return '-';
        try {
          const parsed = JSON.parse(content);
          const text = parsed.content || parsed.text || content;
          return typeof text === 'string' ? text.slice(0, 50) : JSON.stringify(text).slice(0, 50);
        } catch {
          return content.slice(0, 50);
        }
      },
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: WecomMessage) => (
        <a onClick={() => setContentModal({ open: true, content: record.content || '' })}>
          查看详情
        </a>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <List>
        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>消息记录</h1>
              <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>企业微信收发消息日志</div>
            </Col>
          </Row>

          <Input
            placeholder="搜索发送者或内容"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, marginBottom: 16 }}
            allowClear
          />

          <Table
            columns={columns}
            rowKey="id"
            dataSource={result?.data || []}
            loading={tableQuery.isLoading}
            pagination={{
              current: currentPage,
              pageSize,
              total: result?.total || 0,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />

          <Modal
            title="消息详情"
            open={contentModal.open}
            onCancel={() => setContentModal({ open: false, content: '' })}
            footer={null}
            width={600}
          >
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              {contentModal.content}
            </pre>
          </Modal>
        </Card>
      </List>
    </div>
  );
};
