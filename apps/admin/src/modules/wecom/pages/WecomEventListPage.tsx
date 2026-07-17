import { useTable } from '@refinedev/core';
import { List } from '@refinedev/antd';
import { Table, Card, Row, Col, Tag, Input, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface WecomEvent {
  id: string;
  configId: string;
  eventType: string;
  eventKey?: string;
  fromUser?: string;
  content?: string;
  createdAt: Date;
  config?: { name: string };
}

export const WecomEventListPage = () => {
  const [searchText, setSearchText] = useState('');
  const [contentModal, setContentModal] = useState<{ open: boolean; content: string }>({
    open: false,
    content: '',
  });

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } = useTable<WecomEvent>({
    resource: 'wecom.event',
    pagination: { currentPage: 1, pageSize: 20, mode: 'server' },
    filters: {
      initial: searchText
        ? [{ field: 'search', operator: 'contains', value: searchText } as any]
        : [],
    },
  });

  const result = tableQuery.data;

  const eventTypeColorMap: Record<string, string> = {
    subscribe: 'green',
    unsubscribe: 'red',
    enter_agent: 'blue',
    external_contact: 'purple',
    location: 'cyan',
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
      title: '事件类型',
      dataIndex: 'eventType',
      width: 140,
      render: (type: string) => <Tag color={eventTypeColorMap[type] || 'default'}>{type}</Tag>,
    },
    {
      title: '事件 Key',
      dataIndex: 'eventKey',
      width: 140,
      render: (key: string) => key || '-',
    },
    {
      title: '触发用户',
      dataIndex: 'fromUser',
      width: 120,
      render: (user: string) => user || '-',
    },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (content: string) => content?.slice(0, 50) || '-',
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: WecomEvent) => (
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
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>事件记录</h1>
              <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>企业微信事件回调日志</div>
            </Col>
          </Row>

          <Input
            placeholder="搜索事件类型或用户"
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
            title="事件详情"
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
