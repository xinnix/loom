import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useList, useInvalidate } from '@refinedev/core';
import { Tag, Space, Button, Modal, Select, App } from 'antd';
import type { ReactNode } from 'react';
import {
  EyeOutlined,
  PlayCircleOutlined,
  ApiOutlined,
  BarChartOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';

/**
 * YML agent 的 icon 字段存的是 AntD 图标组件名字符串（如 "RobotOutlined"），
 * 需映射为图标节点渲染，直接放进 JSX 会把组件名当文本显示。
 */
const AGENT_ICONS: Record<string, ReactNode> = {
  RobotOutlined: <RobotOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

interface LlmConfigOption {
  id: string;
  name: string;
  model: string;
  isActive: boolean;
}

/**
 * Agent 编排列表页（AI 第 3 层）。
 * 编排定义真理源在 YML（apps/api/src/ai/definitions/agents/），
 * 行数据由 loader 同步——无新建/编辑/删除；仅模型绑定（llmConfigId，
 * D3 解析链的 Agent 级回退）开放部署期配置。
 */
export function AgentListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const invalidate = useInvalidate();

  const [bindModal, setBindModal] = useState<{ open: boolean; record?: any }>({ open: false });
  const [targetConfigId, setTargetConfigId] = useState<string | null>(null);
  const [binding, setBinding] = useState(false);

  const { result: configsResult } = useList<LlmConfigOption>({
    resource: 'llmConfigs',
    pagination: { pageSize: 100 },
  });
  const configs = configsResult?.data ?? [];

  const openBindModal = (record: any) => {
    setTargetConfigId(record.llmConfigId ?? null);
    setBindModal({ open: true, record });
  };

  const handleBind = async () => {
    if (!bindModal.record) return;
    setBinding(true);
    try {
      const trpc = getTrpcClient() as any;
      await trpc.agents.bindLlm.mutate({ id: bindModal.record.id, llmConfigId: targetConfigId });
      message.success('模型绑定已更新');
      invalidate({ resource: 'agents', invalidates: ['list', 'detail'] });
      setBindModal({ open: false });
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setBinding(false);
    }
  };

  const columns: StandardListPageProps['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (name: string, record: any) => (
        <Space>
          {(record.icon && AGENT_ICONS[record.icon]) || <RobotOutlined />}
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
      title: '模型',
      dataIndex: 'llmConfigId',
      key: 'llmConfigId',
      width: 150,
      render: (v: string | null) => {
        if (!v) return <Tag color="gold">全局默认</Tag>;
        const cfg = configs.find((c) => c.id === v);
        return cfg ? <Tag color="geekblue">{cfg.name}</Tag> : <Tag>未知配置</Tag>;
      },
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
    <>
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
              icon={<ApiOutlined />}
              onClick={() => openBindModal(record)}
            >
              绑定
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
      <Modal
        title={`绑定模型：${bindModal.record?.name ?? ''}`}
        open={bindModal.open}
        onOk={handleBind}
        confirmLoading={binding}
        onCancel={() => setBindModal({ open: false })}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Select
            value={targetConfigId}
            onChange={setTargetConfigId}
            style={{ width: '100%' }}
            options={[
              { value: null, label: '跟随全局默认（isDefault 配置）' },
              ...configs
                .filter((c) => c.isActive)
                .map((c) => ({ value: c.id, label: `${c.name}（${c.model}）` })),
            ]}
          />
          <span style={{ color: 'var(--ant-color-text-tertiary, #999)', fontSize: 12 }}>
            Agent 级默认模型——YML 节点未指定 llm: 时回退到此配置；清除绑定则回退全局默认。
          </span>
        </div>
      </Modal>
    </>
  );
}
