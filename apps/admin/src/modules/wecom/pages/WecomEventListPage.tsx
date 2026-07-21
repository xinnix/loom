import { useState } from 'react';
import { Tag, Button, Modal, Space } from 'antd';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';

const eventTypeColorMap: Record<string, string> = {
  subscribe: 'green',
  unsubscribe: 'red',
  enter_agent: 'blue',
  external_contact: 'purple',
  location: 'cyan',
};

/**
 * 企业微信事件记录列表页
 *
 * 只读列表，通过 Modal 查看事件详情。
 */
export function WecomEventListPage() {
  const [contentModal, setContentModal] = useState<{ open: boolean; content: string }>({
    open: false,
    content: '',
  });

  const columns: StandardListPageProps['columns'] = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '配置',
      key: 'configName',
      width: 120,
      render: (_: any, record: any) => record.config?.name || '-',
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
  ];

  return (
    <>
      <StandardListPage
        resource="wecom.event"
        title="事件记录"
        columns={columns}
        hideCreateButton
        searchFields={[{ field: 'search', placeholder: '搜索事件类型或用户' }]}
        renderRowActions={(record: any) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => setContentModal({ open: true, content: record.content || '' })}
            >
              查看详情
            </Button>
          </Space>
        )}
      />

      <Modal
        title="事件详情"
        open={contentModal.open}
        onCancel={() => setContentModal({ open: false, content: '' })}
        footer={<Button onClick={() => setContentModal({ open: false, content: '' })}>关闭</Button>}
        width={600}
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13 }}>
          {contentModal.content || '(无内容)'}
        </pre>
      </Modal>
    </>
  );
}
