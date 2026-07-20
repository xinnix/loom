// StandardForm 类型定义

import { ReactNode } from 'react';
import type { Rule, FormInstance } from 'antd/es/form';

/**
 * 字段类型
 */
export type FieldType =
  | 'input' // 文本输入
  | 'textarea' // 长文本
  | 'number' // 数字输入
  | 'select' // 下拉单选
  | 'multiSelect' // 下拉多选
  | 'switch' // 开关
  | 'checkbox' // 复选框
  | 'date' // 日期选择
  | 'dateRange' // 日期范围
  | 'upload' // 单图上传
  | 'uploadMultiple' // 多图上传
  | 'richText' // 富文本编辑
  | 'custom'; // 自定义类型

/**
 * Select 选项
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 字段定义
 */
export interface FieldDefinition {
  key: string; // 字段名
  label: string; // 字段标签
  type: FieldType; // 字段类型
  required?: boolean; // 是否必填
  placeholder?: string; // 占位符
  tooltip?: string; // 提示信息

  // 类型特定配置
  options?: SelectOption[]; // Select 选项
  resource?: string; // 下拉数据源 resource
  resourceFilter?: Record<string, unknown>; // 下拉数据筛选条件
  maxFileSize?: number; // 上传文件大小限制
  accept?: string; // 上传文件类型
  maxCount?: number; // 多图上传数量限制
  min?: number; // 数字最小值
  max?: number; // 数字最大值
  precision?: number; // 数字精度
  formatter?: (value: number | string | undefined) => string; // 数字格式化函数
  parser?: (value: string | undefined) => number; // 数字解析函数
  maxLength?: number; // 文本最大长度
  showTime?: boolean; // 日期选择器显示时间
  format?: string; // 日期格式
  valuePropName?: string; // Switch/Checkbox 的 valuePropName
  initialValue?: unknown; // 初始值

  // 验证规则
  rules?: Rule[]; // 自定义验证规则
  pattern?: RegExp; // 正则验证

  // 条件显示
  showOnlyInCreate?: boolean; // 仅在创建模式显示
  showOnlyInEdit?: boolean; // 仅在编辑模式显示
  watchDependency?: string; // 监听字段依赖
  showCondition?: (value: unknown) => boolean; // 条件显示函数

  // 自定义渲染
  render?: (field: FieldDefinition, form: FormInstance) => ReactNode; // 自定义字段渲染
}

/**
 * Form Props（传递给表单组件）
 */
export interface FormProps {
  form: FormInstance; // Antd Form 实例
  isEdit: boolean; // 编辑模式
}

/**
 * StandardForm Props
 */
export interface StandardFormProps extends FormProps {
  fields: FieldDefinition[]; // 字段定义数组
}
