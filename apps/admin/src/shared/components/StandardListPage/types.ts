// StandardListPage 类型定义

import type { FormInstance } from 'antd/es/form';
import type { ColumnType } from 'antd/es/table';
import type { ReactNode } from 'react';
import type { PermissionKey } from '@loom/shared';

/**
 * 搜索字段配置
 */
export interface SearchFieldConfig {
  field: string; // 搜索字段名
  placeholder?: string; // 占位符
  width?: number; // 搜索框宽度（默认250）
  debounce?: number; // 延迟时间（默认300ms）
}

/**
 * 筛选字段配置
 */
export interface FilterFieldConfig {
  field: string; // 筛选字段名
  type: 'select' | 'dateRange'; // 筛选类型
  placeholder?: string; // 占位符
  options?: SelectOption[]; // Select 选项（type='select'）
  resource?: string; // 下拉数据源（type='select'）
  resourceFilter?: Record<string, unknown>; // 下拉数据筛选条件
  width?: number; // 筛选框宽度（默认120）
}

/**
 * Select 选项
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 统计卡片配置
 */
export interface StatisticConfig {
  title: string; // 统计项标题
  field?: string; // 统计字段名（可选，不填则自定义计算）
  value?: number; // 固定值（可选）
  filter?: { field: string; value: unknown }; // 筛选条件（可选）
  icon?: ReactNode; // 图标
  color?: string; // 颜色
  precision?: number; // 数字精度（默认0）
  prefix?: ReactNode; // 前缀
  suffix?: ReactNode; // 后缀
}

/**
 * 权限配置
 */
export interface PermissionConfig {
  create?: PermissionKey; // 创建权限
  update?: PermissionKey; // 更新权限
  delete?: PermissionKey; // 删除权限
}

/**
 * StandardListPage Props
 */
export interface StandardListPageProps<T = Record<string, unknown>> {
  // 必需配置
  resource: string; // Refine resource 名称
  title: string; // 页面标题
  columns: ColumnType<T>[]; // 表格列定义

  // 可选配置
  formComponent?: React.ComponentType<FormProps>; // 创建/编辑表单组件
  formWidth?: number; // Modal 宽度（默认600）
  maxWidth?: number; // 页面容器宽度（默认1200）

  // 搜索/筛选配置
  searchFields?: SearchFieldConfig[]; // 搜索字段配置
  filterFields?: FilterFieldConfig[]; // 筛选字段配置
  defaultFilters?: Record<string, unknown>; // 默认筛选条件

  // 统计卡片配置
  statistics?: StatisticConfig[]; // 统计项配置

  // 特殊操作
  specialActions?: ReactNode; // 特殊操作按钮（导出、二维码等）
  hideCreateButton?: boolean; // 隐藏新建按钮

  // 权限控制
  permissions?: PermissionConfig; // 权限配置

  // Refine meta
  meta?: Record<string, unknown>; // useTable 的 meta 参数

  // 自定义渲染
  renderRowActions?: (record: T) => ReactNode; // 自定义行操作
  renderHeader?: () => ReactNode; // 自定义 Header 区域
  renderModalContent?: () => ReactNode; // 自定义 Modal 内容
}

/**
 * Form Props（传递给表单组件）
 */
export interface FormProps {
  form: FormInstance; // Antd Form 实例
  isEdit: boolean; // 编辑模式
}
