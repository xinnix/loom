import { useState } from 'react';
import { Tag, Button, Space, Popconfirm } from 'antd';
import { ApiOutlined, LoadingOutlined } from '@ant-design/icons';
import { StandardListPage } from '../../../shared/components/StandardListPage';
import type { StandardListPageProps } from '../../../shared/components/StandardListPage/types';
import { getTrpcClient } from '../../../shared/trpc/trpcClient';
import { Modal } from 'antd';
import { LlmConfigForm } from '../components/LlmConfigForm';

/**
 * 模型配置列表页（AI 第 1 层，标准 CRUD）。
 * apiKey 掩码展示，testConnection 实测连通性。
 */
export function LlmConfigListPage() {
  const [testModal, setTestModal] = useState<{ open: boolean; record?: any }>({ open: false });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
    model?: string;
  } | null>(null);

  const columns: StandardListPageProps['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '配置键',
      dataIndex: 'configKey',
      key: 'configKey',
      width: 140,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (v: string) => <Tag color="green">{v}</Tag>,
    },
    { title: '模型', dataIndex: 'model', key: 'model', width: 160 },
    {
      title: 'API Key',
      dataIndex: 'apiKeyMask',
      key: 'apiKeyMask',
      width: 130,
      render: (v: string | null) => <code>{v ?? '—'}</code>,
    },
    {
      title: '默认',
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 70,
      render: (v: boolean) => (v ? <Tag color="gold">默认</Tag> : '—'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '停用'}</Tag>,
    },
  ];

  const runTest = async (values: { apiKey?: string }) => {
    setTesting(true);
    setTestResult(null);
    try {
      const trpc = getTrpcClient() as any;
      // 编辑态留空 key 时不传（后端不更新）
      const result = await trpc.llmConfigs.testConnection.mutate({
        id: testModal.record.id,
      });
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, error: (err as Error).message });
    } finally {
      setTesting(false);
      void values;
    }
  };

  return (
    <>
      <StandardListPage
        resource="llmConfigs"
        title="模型配置"
        columns={columns}
        formComponent={LlmConfigForm}
        formWidth={640}
        searchFields={[{ field: 'search', placeholder: '搜索名称或配置键' }]}
        renderRowActions={(record: any, helpers) => (
          <Space>
            <Button type="link" size="small" onClick={() => helpers.edit(record)}>
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              icon={<ApiOutlined />}
              onClick={() => setTestModal({ open: true, record })}
            >
              测试
            </Button>
            <Popconfirm title="确认删除？" onConfirm={() => helpers.delete(String(record.id))}>
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        )}
      />
      <Modal
        title={`连通性测试：${testModal.record?.name ?? ''}`}
        open={testModal.open}
        onCancel={() => {
          setTestModal({ open: false });
          setTestResult(null);
        }}
        footer={null}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            type="primary"
            loading={testing}
            icon={testing ? <LoadingOutlined /> : <ApiOutlined />}
            onClick={() => runTest({})}
          >
            发送测试请求（1 token）
          </Button>
          {testResult && (
            <div>
              {testResult.ok ? (
                <Tag color="success">
                  连接正常 · {testResult.latencyMs}ms · {testResult.model}
                </Tag>
              ) : (
                <Tag color="error">失败：{testResult.error}</Tag>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
