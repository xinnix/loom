import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTable, useCreate, useUpdate, useDelete, useDeleteMany } from '@refinedev/core';
import { List } from '@refinedev/antd';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Card,
  Row,
  Col,
  App,
  Popconfirm,
} from 'antd';
import { SearchOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { AgentForm } from '../components/AgentForm';

interface Agent {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider: string;
  apiUrl?: string;
  apiKey?: string;
  isActive: boolean;
  sort: number;
  createdAt: Date;
}

export const AgentListPage = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Agent | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();
  const { mutate: deleteMany } = useDeleteMany();

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } = useTable<Agent>({
    resource: 'agents',
    pagination: { currentPage: 1, pageSize: 20, mode: 'server' },
    filters: {
      initial: searchText
        ? [{ field: 'search', operator: 'contains', value: searchText } as any]
        : [],
    },
  });

  const result = tableQuery.data;

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      model: 'gpt-4o',
      provider: 'openai',
      isActive: true,
      sort: 0,
    });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Agent) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      slug: record.slug,
      description: record.description,
      icon: record.icon,
      model: record.model,
      systemPrompt: record.systemPrompt,
      temperature: record.temperature ?? undefined,
      maxTokens: record.maxTokens ?? undefined,
      provider: record.provider,
      apiUrl: record.apiUrl || '',
      apiKey: '',
      isActive: record.isActive,
      sort: record.sort,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        const updateData: any = { ...values };
        if (!updateData.apiKey) delete updateData.apiKey;
        if (updateData.apiUrl === '') updateData.apiUrl = null;

        update(
          { resource: 'agents', id: editingRecord.id, values: updateData },
          {
            onSuccess: () => {
              message.success('更新成功');
              setIsModalVisible(false);
              tableQuery.refetch();
            },
            onError: (error: any) => {
              message.error('更新失败: ' + (error.message || '未知错误'));
            },
          },
        );
      } else {
        create(
          { resource: 'agents', values },
          {
            onSuccess: () => {
              message.success('创建成功');
              setIsModalVisible(false);
              tableQuery.refetch();
            },
            onError: (error: any) => {
              message.error('创建失败: ' + (error.message || '未知错误'));
            },
          },
        );
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleDelete = (id: string) => {
    deleteOne(
      { resource: 'agents', id },
      {
        onSuccess: () => {
          message.success('删除成功');
          tableQuery.refetch();
        },
        onError: (error: any) => {
          message.error('删除失败: ' + (error.message || '未知错误'));
        },
      },
    );
  };

  const handleDeleteMany = () => {
    if (selectedRowKeys.length === 0) return;
    deleteMany(
      { resource: 'agents', ids: selectedRowKeys },
      {
        onSuccess: () => {
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          tableQuery.refetch();
        },
        onError: (error: any) => {
          message.error('批量删除失败: ' + (error.message || '未知错误'));
        },
      },
    );
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
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
      width: 130,
      render: (slug: string) => <Tag color="default">{slug}</Tag>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      width: 120,
      render: (model: string) => <Tag color="blue">{model}</Tag>,
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      width: 100,
      render: (provider: string) => (
        <Tag color={provider === 'openai' ? 'green' : provider === 'anthropic' ? 'purple' : 'default'}>
          {provider}
        </Tag>
      ),
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      width: 70,
      render: (temp: number | null) => (temp !== null && temp !== undefined ? temp.toFixed(1) : '-'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 70,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Agent) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此 Agent？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <List>
        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>AI 助手管理</h1>
              <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
                配置和管理 AI 助手的 LLM 模型与参数
              </div>
            </Col>
            <Col>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title={`确定删除 ${selectedRowKeys.length} 个 Agent？`}
                    onConfirm={handleDeleteMany}
                  >
                    <Button danger>批量删除</Button>
                  </Popconfirm>
                )}
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  新建 AI 助手
                </Button>
              </Space>
            </Col>
          </Row>

          <Input
            placeholder="搜索名称或标识"
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
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }}
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
            title={editingRecord ? '编辑 AI 助手' : '新建 AI 助手'}
            open={isModalVisible}
            onOk={handleSubmit}
            onCancel={() => setIsModalVisible(false)}
            okText="确定"
            cancelText="取消"
            width={640}
          >
            <AgentForm form={form} isEdit={!!editingRecord} />
          </Modal>
        </Card>
      </List>
    </div>
  );
};
