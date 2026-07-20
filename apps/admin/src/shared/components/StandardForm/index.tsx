import { Form, Input, InputNumber, Select, Switch, Checkbox, DatePicker } from 'antd';
import { useList } from '@refinedev/core';
import { useWatch } from 'antd/es/form/Form';
import type { FormInstance } from 'antd/es/form';
import type { StandardFormProps, FieldDefinition } from './types';
import { OSSUpload } from '../OSSUpload';
import { OSSUploadMultiple } from '../OSSUploadMultiple';
import { RichTextEditor } from '../RichTextEditor';

/**
 * StandardForm - 标准表单组件
 *
 * 功能:
 * - 根据字段类型自动渲染表单控件
 * - 自动生成验证规则
 * - 支持 resource 类型的下拉选项
 * - 支持字段依赖监听
 */
export function StandardForm({ form, isEdit, fields }: StandardFormProps) {
  return (
    <Form form={form} layout="vertical">
      {fields.map((field) => (
        <FormFieldItem key={field.key} field={field} form={form} isEdit={isEdit} />
      ))}
    </Form>
  );
}

/**
 * 单个字段的 FormItem，将 useWatch 提升到组件级别
 */
function FormFieldItem({
  field,
  form,
  isEdit,
}: {
  field: FieldDefinition;
  form: FormInstance;
  isEdit: boolean;
}) {
  // 字段依赖监听 — hooks 必须无条件调用
  const dependencyValue = useWatch(field.watchDependency ?? '', form);

  // 条件显示逻辑
  if (field.showOnlyInCreate && isEdit) return null;
  if (field.showOnlyInEdit && !isEdit) return null;

  // 字段依赖条件
  if (field.watchDependency && field.showCondition && !field.showCondition(dependencyValue)) {
    return null;
  }

  return (
    <Form.Item
      name={field.key}
      label={field.label}
      tooltip={field.tooltip}
      valuePropName={field.valuePropName || (field.type === 'switch' ? 'checked' : 'value')}
      rules={buildRules(field)}
      initialValue={field.initialValue}
    >
      {renderField(field, form)}
    </Form.Item>
  );
}

/**
 * 构建验证规则
 */
function buildRules(field: FieldDefinition) {
  const rules: unknown[] = [];

  // 必填规则
  if (field.required) {
    rules.push({
      required: true,
      message: `请输入${field.label}`,
    });
  }

  // 正则验证
  if (field.pattern) {
    rules.push({
      pattern: field.pattern,
      message: `${field.label}格式不正确`,
    });
  }

  // 数字范围验证
  if (field.type === 'number') {
    if (field.min !== undefined) {
      rules.push({
        type: 'number',
        min: field.min,
        message: `${field.label}不能小于${field.min}`,
      });
    }
    if (field.max !== undefined) {
      rules.push({
        type: 'number',
        max: field.max,
        message: `${field.label}不能大于${field.max}`,
      });
    }
  }

  // 文本长度验证
  if (field.maxLength && (field.type === 'input' || field.type === 'textarea')) {
    rules.push({
      max: field.maxLength,
      message: `${field.label}不能超过${field.maxLength}个字符`,
    });
  }

  // 合并自定义规则
  return [...rules, ...(field.rules || [])];
}

/**
 * 渲染字段
 */
function renderField(field: FieldDefinition, form: FormInstance) {
  // 自定义渲染
  if (field.render) {
    return field.render(field, form);
  }

  // 根据类型渲染
  switch (field.type) {
    case 'input':
      return (
        <Input
          placeholder={field.placeholder || `请输入${field.label}`}
          maxLength={field.maxLength}
        />
      );

    case 'textarea':
      return (
        <Input.TextArea
          placeholder={field.placeholder || `请输入${field.label}`}
          maxLength={field.maxLength}
          rows={4}
        />
      );

    case 'number':
      return (
        <InputNumber
          placeholder={field.placeholder || `请输入${field.label}`}
          min={field.min}
          max={field.max}
          precision={field.precision}
          formatter={field.formatter}
          parser={field.parser}
          style={{ width: '100%' }}
        />
      );

    case 'select':
      // 如果有 resource 配置,动态获取选项
      if (field.resource) {
        return <DynamicSelect field={field} />;
      }
      // 否则使用静态 options
      return (
        <Select
          placeholder={field.placeholder || `请选择${field.label}`}
          options={field.options || []}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      );

    case 'multiSelect':
      if (field.resource) {
        return <DynamicSelect field={field} mode="multiple" />;
      }
      return (
        <Select
          mode="multiple"
          placeholder={field.placeholder || `请选择${field.label}`}
          options={field.options || []}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      );

    case 'switch':
      return <Switch />;

    case 'checkbox':
      return <Checkbox>{field.label}</Checkbox>;

    case 'date':
      return (
        <DatePicker
          placeholder={field.placeholder || `请选择${field.label}`}
          showTime={field.showTime}
          format={field.format}
          style={{ width: '100%' }}
        />
      );

    case 'dateRange':
      return (
        <DatePicker.RangePicker
          placeholder={[field.placeholder || '开始时间', '结束时间']}
          showTime={field.showTime}
          format={field.format}
          style={{ width: '100%' }}
        />
      );

    case 'upload':
      return (
        <OSSUpload
          accept={field.accept || 'image/jpeg,image/png,image/webp'}
          maxFileSize={field.maxFileSize || 5 * 1024 * 1024}
        />
      );

    case 'uploadMultiple':
      return (
        <OSSUploadMultiple
          accept={field.accept || 'image/jpeg,image/png,image/webp'}
          maxFileSize={field.maxFileSize || 5 * 1024 * 1024}
          maxCount={field.maxCount || 5}
        />
      );

    case 'richText':
      return <RichTextEditor />;

    case 'custom':
      return null;

    default:
      return <Input placeholder={field.placeholder} />;
  }
}

/**
 * DynamicSelect - 动态获取下拉选项的 Select
 */
function DynamicSelect({ field, mode }: { field: FieldDefinition; mode?: 'multiple' }) {
  const { result } = useList<Record<string, unknown>>({
    resource: field.resource!,
    pagination: { pageSize: 100 },
    filters: field.resourceFilter ? [field.resourceFilter] : [],
  });

  const data = result?.data || [];

  // 转换为 Select options 格式
  const options = data.map((item) => ({
    value: item.id as string | number,
    label: (item.name || item.title || item.username || item.id) as string,
  }));

  return (
    <Select
      mode={mode}
      placeholder={field.placeholder || `请选择${field.label}`}
      options={options}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
      }
    />
  );
}
