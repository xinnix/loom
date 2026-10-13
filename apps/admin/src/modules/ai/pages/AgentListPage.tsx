import { useNavigate } from 'react-router-dom';
import { Tag, Space, Button } from 'antd';
import {
  EyeOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';

/**
 * Agent 编排列表页（AI 第 3 层，只读）。
 * 编排定义真理源在 YML（apps/api/src/ai/definitions/agents/），
 * 行数据由 loader 同步——无新建/编辑/删除。
 */
export function AgentListPage() {
  const navigate = useNavigate();

  const columns: StandardListPageProps['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (name: string, record: any) => (
        <Space>
          {record.icon ? <span>{record.icon}</span> : <RobotOutlined />}
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '标识',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '停用'}</Tag>,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 70 },
  ];

  return (
    <StandardListPage
      resource="agents"
      title="Agent 编排"
      columns={columns}
      hideCreateButton
      searchFields={[{ field: 'search', placeholder: '搜索名称或标识' }]}
      renderRowActions={(record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/ai/agents/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => navigate(`/ai/agents/${record.slug}/playground`)}
          >
            调试
          </Button>
        </Space>
      )}
    />
  );
}

export { BarChartOutlined };
