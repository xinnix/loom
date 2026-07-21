import { useState } from 'react';
import { Tag, Button, Modal, Space } from 'antd';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';

const directionMap: Record<string, { color: string; label: string }> = {
  received: { color: 'blue', label: '收到' },
  sent: { color: 'green', label: '发送' },
};

/**
 * 企业微信消息记录列表页
 *
 * 只读列表，通过 Modal 查看消息详情。
 */
export function WecomMessageListPage() {
  const [contentModal, setContentModal] = useState<{ open: boolean; content: string }>({
    open: false,
    content: '',
  });

  const renderContent = (content: string) => {
    if (!content) return '-';
    try {
      const parsed = JSON.parse(content);
      const text = parsed.content || parsed.text || content;
      return typeof text === 'string' ? text.slice(0, 50) : JSON.stringify(text).slice(0, 50);
    } catch {
      return content.slice(0, 50);
    }
  };

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
      render: (content: string) => renderContent(content),
    },
  ];

  return (
    <>
      <StandardListPage
        resource="wecom.message"
        title="消息记录"
        columns={columns}
        hideCreateButton
        searchFields={[{ field: 'search', placeholder: '搜索发送者或内容' }]}
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
        title="消息详情"
        open={contentModal.open}
        onCancel={() => setContentModal({ open: false, content: '' })}
        footer={<Button onClick={() => setContentModal({ open: false, content: '' })}>关闭</Button>}
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
          {contentModal.content || '(无内容)'}
        </pre>
      </Modal>
    </>
  );
}
