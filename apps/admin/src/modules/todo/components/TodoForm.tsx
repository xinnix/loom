import type { FieldDefinition } from '../../../shared/components/StandardForm/types';
import { StandardForm } from '../../../shared/components/StandardForm';
import type { FormInstance } from 'antd/es/form';

/**
 * Todo 表单字段定义
 *
 * 这是 StandardForm 的「声明式字段配置」模式：
 *   通过定义 FieldDefinition[] 数组，自动渲染表单，无需手写 JSX。
 *
 * @see StandardForm 组件：apps/admin/src/shared/components/StandardForm/
 */
export const todoFormFields: FieldDefinition[] = [
  {
    key: 'title',
    label: '标题',
    type: 'input',
    required: true,
    placeholder: '请输入待办事项标题',
    maxLength: 200,
  },
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '请输入详细描述（可选）',
    maxLength: 1000,
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { value: 'pending', label: '待处理' },
      { value: 'in_progress', label: '进行中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' },
    ],
  },
  {
    key: 'priority',
    label: '优先级',
    type: 'number',
    min: 0,
    max: 2,
    tooltip: '0=低, 1=中, 2=高',
  },
  {
    key: 'dueDate',
    label: '截止日期',
    type: 'date',
    showTime: false,
  },
];

/**
 * Todo 状态标签颜色映射
 */
export const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'error',
};

/**
 * Todo 状态中文映射
 */
export const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * Todo 优先级标签颜色映射
 */
export const PRIORITY_COLORS: Record<number, string> = {
  0: 'default',
  1: 'orange',
  2: 'red',
};

/**
 * Todo 优先级中文映射
 */
export const PRIORITY_LABELS: Record<number, string> = {
  0: '低',
  1: '中',
  2: '高',
};

/**
 * StandardForm 模式：声明式表单组件
 */
export function TodoForm({ form, isEdit }: { form: FormInstance; isEdit: boolean }) {
  return <StandardForm form={form} isEdit={isEdit} fields={todoFormFields} />;
}
