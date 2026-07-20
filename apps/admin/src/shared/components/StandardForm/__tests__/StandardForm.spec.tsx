import { describe, it, expect, vi } from 'vitest';
import { Form } from 'antd';
import { renderWithAntd } from '../../../../test/render';
import { StandardForm } from '../index';
import type { FieldDefinition } from '../types';

// Mock OSS dependencies (avoid real upload/OSS in tests)
vi.mock('../../OSSUpload', () => ({
  OSSUpload: () => <div data-testid="mock-oss-upload">OSSUpload</div>,
}));
vi.mock('../../OSSUploadMultiple', () => ({
  OSSUploadMultiple: () => <div data-testid="mock-oss-upload-multiple">OSSUploadMultiple</div>,
}));
vi.mock('../../RichTextEditor', () => ({
  default: () => <div data-testid="mock-rich-text">RichTextEditor</div>,
  RichTextEditor: () => <div data-testid="mock-rich-text">RichTextEditor</div>,
}));

function renderForm(fields: FieldDefinition[], isEdit = false) {
  let formInstance: ReturnType<typeof Form.useForm>[0];
  const FormWrapper = () => {
    const [form] = Form.useForm();
    formInstance = form;
    return <StandardForm form={form} isEdit={isEdit} fields={fields} />;
  };
  const view = renderWithAntd(<FormWrapper />);
  return { view, getForm: () => formInstance! };
}

describe('StandardForm', () => {
  describe('field rendering', () => {
    it('renders input field', () => {
      const fields: FieldDefinition[] = [
        { key: 'name', label: '名称', type: 'input', required: true },
      ];
      const { view } = renderForm(fields);
      expect(view.getByText('名称')).toBeTruthy();
      expect(view.getByPlaceholderText('请输入名称')).toBeTruthy();
    });

    it('renders textarea field', () => {
      const fields: FieldDefinition[] = [
        { key: 'desc', label: '描述', type: 'textarea', maxLength: 500 },
      ];
      const { view } = renderForm(fields);
      // Ant Design renders TextArea - checking for textarea element
      const textarea = view.container.querySelector('textarea');
      expect(textarea).toBeTruthy();
    });

    it('renders number field with min/max', () => {
      const fields: FieldDefinition[] = [
        { key: 'price', label: '价格', type: 'number', min: 0, max: 99999, precision: 2 },
      ];
      const { view } = renderForm(fields);
      expect(view.getByText('价格')).toBeTruthy();
    });

    it('renders number field with formatter/parser for currency', () => {
      const fields: FieldDefinition[] = [
        {
          key: 'price',
          label: '价格',
          type: 'number',
          formatter: (value: any) => `¥ ${value}`,
          parser: (value: any) => Number(value!.replace(/¥\s?/, '')),
        },
      ];
      const { view } = renderForm(fields);
      expect(view.getByText('价格')).toBeTruthy();
    });

    it('renders select with options', () => {
      const fields: FieldDefinition[] = [
        {
          key: 'status',
          label: '状态',
          type: 'select',
          options: [
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '停用' },
          ],
        },
      ];
      const { view } = renderForm(fields);
      expect(view.getByText('状态')).toBeTruthy();
    });

    it('renders switch field', () => {
      const fields: FieldDefinition[] = [{ key: 'isActive', label: '启用的', type: 'switch' }];
      const { view } = renderForm(fields);
      const checkbox = view.getByRole('switch');
      expect(checkbox).toBeTruthy();
    });

    it('renders checkbox field', () => {
      const fields: FieldDefinition[] = [{ key: 'agree', label: '同意协议', type: 'checkbox' }];
      const { view } = renderForm(fields);
      // Checkbox label appears twice (form label + checkbox itself)
      const labels = view.getAllByText('同意协议');
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });

    it('renders date picker', () => {
      const fields: FieldDefinition[] = [
        { key: 'dueDate', label: '截止日期', type: 'date', showTime: false },
      ];
      const { view } = renderForm(fields);
      expect(view.getByText('截止日期')).toBeTruthy();
    });

    it('renders date range picker', () => {
      const fields: FieldDefinition[] = [{ key: 'range', label: '日期范围', type: 'dateRange' }];
      const { view } = renderForm(fields);
      expect(view.getByText('日期范围')).toBeTruthy();
    });

    it('renders upload field', () => {
      const fields: FieldDefinition[] = [{ key: 'avatar', label: '头像', type: 'upload' }];
      const { view } = renderForm(fields);
      expect(view.getByTestId('mock-oss-upload')).toBeTruthy();
    });

    it('renders upload multiple field', () => {
      const fields: FieldDefinition[] = [{ key: 'images', label: '图片', type: 'uploadMultiple' }];
      const { view } = renderForm(fields);
      expect(view.getByTestId('mock-oss-upload-multiple')).toBeTruthy();
    });

    it('renders rich text field', () => {
      const fields: FieldDefinition[] = [{ key: 'content', label: '内容', type: 'richText' }];
      const { view } = renderForm(fields);
      expect(view.getByTestId('mock-rich-text')).toBeTruthy();
    });

    it('renders custom field via render callback', () => {
      const fields: FieldDefinition[] = [
        {
          key: 'custom',
          label: '自定义',
          type: 'custom',
          render: () => <div data-testid="custom-render">Custom</div>,
        },
      ];
      const { view } = renderForm(fields);
      expect(view.getByTestId('custom-render')).toBeTruthy();
    });
  });

  describe('conditional visibility', () => {
    it('hides showOnlyInCreate fields when isEdit is true', () => {
      const fields: FieldDefinition[] = [
        { key: 'password', label: '密码', type: 'input', showOnlyInCreate: true },
      ];
      const { view } = renderForm(fields, true);
      expect(view.queryByText('密码')).toBeNull();
    });

    it('shows showOnlyInCreate fields when isEdit is false', () => {
      const fields: FieldDefinition[] = [
        { key: 'password', label: '密码', type: 'input', showOnlyInCreate: true },
      ];
      const { view } = renderForm(fields, false);
      expect(view.getByText('密码')).toBeTruthy();
    });

    it('hides showOnlyInEdit fields when isEdit is false', () => {
      const fields: FieldDefinition[] = [
        { key: 'reason', label: '原因', type: 'input', showOnlyInEdit: true },
      ];
      const { view } = renderForm(fields, false);
      expect(view.queryByText('原因')).toBeNull();
    });
  });
});

describe('StandardForm buildRules', () => {
  it('creates required rule', () => {
    const fields: FieldDefinition[] = [
      { key: 'name', label: '名称', type: 'input', required: true },
    ];
    const { view } = renderForm(fields);
    // Check the form item has a required indicator (Ant Design shows * for required)
    expect(view.container.querySelector('.ant-form-item-required')).toBeTruthy();
  });

  it('applies pattern rule', () => {
    const fields: FieldDefinition[] = [
      {
        key: 'phone',
        label: '手机号',
        type: 'input',
        pattern: /^1[3-9]\d{9}$/,
      },
    ];
    const { view } = renderForm(fields);
    expect(view.getByText('手机号')).toBeTruthy();
  });

  it('applies maxLength to input', () => {
    const fields: FieldDefinition[] = [
      { key: 'title', label: '标题', type: 'input', maxLength: 200 },
    ];
    const { view } = renderForm(fields);
    const input = view.getByPlaceholderText('请输入标题') as HTMLInputElement;
    expect(input.maxLength).toBe(200);
  });
});
