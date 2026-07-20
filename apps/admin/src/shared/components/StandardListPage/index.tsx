// StandardListPage 主组件

import { useState, useEffect, useCallback } from 'react';
import {
  useTable,
  useCreate,
  useUpdate,
  useDelete,
  useDeleteMany,
  type CrudFilters,
} from '@refinedev/core';
import { List } from '@refinedev/antd';
import {
  Table,
  Button,
  Modal,
  Form,
  Space,
  Popconfirm,
  Card,
  Row,
  Col,
  App,
  Statistic,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PermissionGuard } from '../PermissionGuard';
import {
  createMutationCallbacks,
  createBatchMutationCallbacks,
} from '../../utils/mutationCallbacks';
import { SearchBar } from './SearchBar';
import type { StandardListPageProps, StatisticConfig } from './types';

/**
 * StandardListPage - 标准列表页面组件
 *
 * 提供完整的 CRUD 列表页面框架，包括：
 * - 搜索/筛选栏
 * - 统计卡片
 * - 批量操作
 * - 分页表格
 * - 创建/编辑 Modal
 */
export function StandardListPage<T extends Record<string, unknown> = Record<string, unknown>>(
  props: StandardListPageProps<T>,
) {
  const {
    resource,
    title,
    columns,
    formComponent,
    formWidth = 600,
    maxWidth = 1200,
    searchFields = [],
    filterFields = [],
    defaultFilters,
    statistics = [],
    specialActions,
    hideCreateButton = false,
    permissions,
    meta,
    renderRowActions,
    renderHeader,
    renderModalContent,
  } = props;

  const FormComponent = formComponent;
  const { message } = App.useApp();

  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(defaultFilters || {});
  const [form] = Form.useForm();

  // 延迟搜索
  const [debouncedSearchValues, setDebouncedSearchValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValues(searchValues);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValues]);

  // 构建 filters
  const buildFilters = useCallback(
    (searchState?: Record<string, string>, filterState?: Record<string, unknown>) => {
      const currentSearchState = searchState || debouncedSearchValues;
      const currentFilterState = filterState || filterValues;
      const filters: CrudFilters = [];

      // 搜索字段
      searchFields.forEach(({ field }) => {
        if (currentSearchState[field]) {
          filters.push({
            field,
            operator: 'contains',
            value: currentSearchState[field],
          });
        }
      });

      // 筛选字段
      filterFields.forEach(({ field, type }) => {
        if (currentFilterState[field]) {
          if (type === 'dateRange' && Array.isArray(currentFilterState[field])) {
            filters.push({
              field,
              operator: 'gte',
              value: (currentFilterState[field] as unknown[])[0],
            });
            filters.push({
              field,
              operator: 'lte',
              value: (currentFilterState[field] as unknown[])[1],
            });
          } else {
            filters.push({
              field,
              operator: 'eq',
              value: currentFilterState[field],
            });
          }
        }
      });

      return filters;
    },
    [debouncedSearchValues, filterValues, searchFields, filterFields],
  );

  // useTable Hook
  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize, setFilters } =
    useTable<T>({
      resource,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        mode: 'server',
      },
      filters: {
        initial: buildFilters(),
      },
      meta,
    });

  // 当过滤器变化时自动触发搜索
  useEffect(() => {
    const filters = buildFilters();
    setFilters(filters);
  }, [buildFilters, setFilters]);

  const result = tableQuery.data;
  const query = tableQuery;
  const data = ((result as Record<string, unknown>)?.data as T[]) || [];
  const total = ((result as Record<string, unknown>)?.total as number) || 0;

  // CRUD mutations
  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();
  const { mutate: deleteMany } = useDeleteMany();

  // Handlers
  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: T) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteOne({ resource, id }, createMutationCallbacks('删除', query, undefined, message));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        update(
          { resource, id: editingRecord.id as string, values },
          createMutationCallbacks(
            '更新',
            query,
            () => {
              setIsModalVisible(false);
            },
            message,
          ),
        );
      } else {
        create(
          { resource, values },
          createMutationCallbacks(
            '创建',
            query,
            () => {
              setIsModalVisible(false);
            },
            message,
          ),
        );
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleSearchChange = (field: string, value: string) => {
    setSearchValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field: string, value: unknown) => {
    setFilterValues((prev) => ({ ...prev, [field]: value }));
  };

  // 统计数据计算
  const getStatisticValue = (config: StatisticConfig) => {
    if (config.value !== undefined) return config.value;
    if (!config.field) return 0;

    if (config.filter) {
      return data.filter((item) => item[config.filter.field] === config.filter.value).length;
    }

    // 计算总和
    return data.reduce((sum: number, item) => sum + ((item[config.field] as number) || 0), 0);
  };

  return (
    <div style={{ maxWidth, margin: '0 auto', padding: '24px' }}>
      <List>
        <Card>
          {/* Header */}
          {renderHeader ? (
            renderHeader()
          ) : (
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
              <Col>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>{title}</h1>
              </Col>
              <Col>
                <Space>
                  {specialActions}
                  {!hideCreateButton && (
                    <PermissionGuard permission={permissions?.create}>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                        新建
                      </Button>
                    </PermissionGuard>
                  )}
                </Space>
              </Col>
            </Row>
          )}

          {/* 统计卡片 */}
          {statistics.length > 0 && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              {statistics.map((stat, index) => (
                <Col span={6} key={index}>
                  <Card>
                    <Statistic
                      title={stat.title}
                      value={getStatisticValue(stat)}
                      prefix={stat.prefix || stat.icon}
                      suffix={stat.suffix}
                      precision={stat.precision || 0}
                      valueStyle={{ color: stat.color }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* 搜索筛选栏 */}
          {(searchFields.length > 0 || filterFields.length > 0) && (
            <SearchBar
              searchFields={searchFields}
              filterFields={filterFields}
              searchValues={searchValues}
              filterValues={filterValues}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
            />
          )}

          {/* 批量操作指示器 */}
          {selectedRowKeys.length > 0 && (
            <Space style={{ marginBottom: 16 }}>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
              <PermissionGuard permission={permissions?.delete}>
                <Popconfirm
                  title="确认批量删除？"
                  description={`将删除 ${selectedRowKeys.length} 个${title}`}
                  onConfirm={() => {
                    deleteMany(
                      { resource, ids: selectedRowKeys },
                      createBatchMutationCallbacks(
                        '删除',
                        selectedRowKeys.length,
                        query,
                        () => setSelectedRowKeys([]),
                        message,
                      ),
                    );
                  }}
                >
                  <Button size="small" danger>
                    批量删除
                  </Button>
                </Popconfirm>
              </PermissionGuard>
            </Space>
          )}

          {/* 表格 */}
          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }}
            columns={[
              ...columns,
              ...(renderRowActions
                ? [
                    {
                      title: '操作',
                      key: 'actions',
                      fixed: 'right' as const,
                      width: 150,
                      render: (record: T) => renderRowActions(record),
                    },
                  ]
                : formComponent
                  ? [
                      {
                        title: '操作',
                        key: 'actions',
                        fixed: 'right' as const,
                        width: 150,
                        render: (_: unknown, record: T) => (
                          <Space>
                            <Button type="link" size="small" onClick={() => handleEdit(record)}>
                              编辑
                            </Button>
                            <Popconfirm
                              title="确认删除？"
                              onConfirm={() => handleDelete(String(record.id))}
                            >
                              <Button type="link" size="small" danger>
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]
                  : []),
            ]}
            rowKey="id"
            dataSource={data}
            loading={query.isLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, newPageSize) => {
                setCurrentPage(page);
                if (newPageSize !== pageSize) {
                  setPageSize(newPageSize);
                  setCurrentPage(1);
                }
              },
            }}
          />
        </Card>
      </List>

      {/* Create/Edit Modal */}
      {FormComponent && (
        <Modal
          title={editingRecord ? `编辑${title}` : `新建${title}`}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
          width={formWidth}
          destroyOnClose
        >
          {renderModalContent ? (
            renderModalContent()
          ) : (
            <FormComponent form={form} isEdit={!!editingRecord} />
          )}
        </Modal>
      )}
    </div>
  );
}
