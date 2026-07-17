import { Space, Input, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import type { SearchFieldConfig, FilterFieldConfig } from './types';

interface SearchBarProps {
  searchFields: SearchFieldConfig[];
  filterFields: FilterFieldConfig[];
  searchValues: Record<string, string>;
  filterValues: Record<string, unknown>;
  onSearchChange: (field: string, value: string) => void;
  onFilterChange: (field: string, value: unknown) => void;
}

/**
 * SearchBar - 搜索筛选栏子组件
 *
 * 功能:
 * - 渲染搜索框(支持延迟搜索)
 * - 渲染筛选器(Select, DatePicker.RangePicker)
 * - 自动获取 resource 类型的下拉数据
 */
export function SearchBar({
  searchFields,
  filterFields,
  searchValues,
  filterValues,
  onSearchChange,
  onFilterChange,
}: SearchBarProps) {
  return (
    <Space style={{ marginBottom: 16 }} wrap>
      {/* 搜索框 */}
      {searchFields.map((field) => (
        <Input
          key={field.field}
          placeholder={field.placeholder || `搜索${field.field}`}
          prefix={<SearchOutlined />}
          value={searchValues[field.field] || ''}
          onChange={(e) => onSearchChange(field.field, e.target.value)}
          style={{ width: field.width || 250 }}
          allowClear
        />
      ))}

      {/* 筛选器 */}
      {filterFields.map((field) => {
        if (field.type === 'select') {
          // 如果有 resource 配置,使用 useList 获取数据
          if (field.resource) {
            return (
              <DynamicSelectFilter
                key={field.field}
                field={field}
                value={filterValues[field.field]}
                onChange={(value) => onFilterChange(field.field, value)}
              />
            );
          }

          // 否则使用静态 options
          return (
            <Select
              key={field.field}
              placeholder={field.placeholder || `筛选${field.field}`}
              value={filterValues[field.field]}
              onChange={(value) => onFilterChange(field.field, value)}
              style={{ width: field.width || 120 }}
              allowClear
              options={field.options || []}
            />
          );
        }

        if (field.type === 'dateRange') {
          return (
            <DatePicker.RangePicker
              key={field.field}
              placeholder={[field.placeholder || '开始日期', '结束日期']}
              value={filterValues[field.field] as any}
              onChange={(dates) => onFilterChange(field.field, dates)}
              style={{ width: field.width || 240 }}
            />
          );
        }

        return null;
      })}
    </Space>
  );
}

/**
 * DynamicSelectFilter - 动态获取下拉数据的筛选器
 */
function DynamicSelectFilter({
  field,
  value,
  onChange,
}: {
  field: FilterFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { result } = useList<Record<string, unknown>>({
    resource: field.resource!,
    pagination: { pageSize: 100 },
    filters: field.resourceFilter ? [field.resourceFilter as any] : [],
  });

  const data = result?.data || [];

  // 转换为 Select options 格式
  const options = data.map((item) => ({
    value: item.id as string | number,
    label: (item.name || item.title || item.username || item.id) as string,
  }));

  return (
    <Select
      placeholder={field.placeholder || `筛选${field.field}`}
      value={value}
      onChange={onChange}
      style={{ width: field.width || 120 }}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
      }
      options={options}
    />
  );
}
