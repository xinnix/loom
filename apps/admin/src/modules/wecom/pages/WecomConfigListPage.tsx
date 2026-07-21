import { Space, Tag, Button, Typography, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import { WecomConfigForm } from '../components/WecomConfigForm';

const { Text } = Typography;

/**
 * 企业微信应用配置列表页
 *
 * 使用 StandardListPage 配置驱动模式。
 * 行操作包含复制回调 URL 的自定义按钮。
 */
export function WecomConfigListPage() {
  const baseUrl = window.location.origin;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const columns: StandardListPageProps['columns'] = [
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '企业 ID',
      dataIndex: 'corpId',
      key: 'corpId',
      width: 200,
      ellipsis: true,
      render: (corpId: string) => <Text code>{corpId}</Text>,
    },
    {
      title: 'AgentId',
      dataIndex: 'agentId',
      key: 'agentId',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '回调 URL',
      key: 'callbackUrl',
      width: 300,
      ellipsis: true,
      render: (_: any, record: any) => {
        const url = `${baseUrl}/api/wecom/callback/${record.id}`;
        return (
          <Space>
            <Text copyable style={{ fontSize: 12 }} ellipsis={{ tooltip: url }}>
              {url}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <StandardListPage
      resource="wecom.config"
      title="企业微信应用配置"
      columns={columns}
      formComponent={WecomConfigForm}
      formWidth={560}
      searchFields={[{ field: 'search', placeholder: '搜索应用名称' }]}
      renderRowActions={(record: any) => (
        <Space>
          <Tooltip title="复制回调 URL">
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(`${baseUrl}/api/wecom/callback/${record.id}`)}
            >
              复制 URL
            </Button>
          </Tooltip>
        </Space>
      )}
    />
  );
}
