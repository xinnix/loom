import { useNavigate } from 'react-router-dom';
import { Tag, Space, Button } from 'antd';
import { EyeOutlined, RobotOutlined } from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import { AgentForm, MODEL_OPTIONS, PROVIDER_OPTIONS, PROVIDER_COLORS } from '../components';

/**
 * Agent 列表页
 *
 * 使用 StandardListPage 配置驱动模式。
 */
export function AgentListPage() {
  const navigate = useNavigate();

  const columns: StandardListPageProps['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string) => (
        <Space>
          <RobotOutlined />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '标识',
      dataIndex: 'slug',
      key: 'slug',
      width: 130,
      render: (slug: string) => <Tag color="default">{slug}</Tag>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 200,
      render: (model: string) => {
        const label = MODEL_OPTIONS.find((o) => o.value === model)?.label || model;
        return <Tag color="blue">{label}</Tag>;
      },
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (provider: string) => (
        <Tag color={PROVIDER_COLORS[provider] || 'default'}>
          {PROVIDER_OPTIONS.find((o) => o.value === provider)?.label || provider}
        </Tag>
      ),
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 70,
      render: (temp: number | null) =>
        temp !== null && temp !== undefined ? temp.toFixed(1) : '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 70,
    },
  ];

  return (
    <StandardListPage
      resource="agents"
      title="AI 助手管理"
      columns={columns}
      formComponent={AgentForm}
      formWidth={640}
      searchFields={[{ field: 'search', placeholder: '搜索名称或标识' }]}
      renderRowActions={(record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/agents/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )}
    />
  );
}
