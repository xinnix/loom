import type { FieldDefinition } from '../../../shared/components/StandardForm/types';
import { StandardForm } from '../../../shared/components/StandardForm';
import type { FormInstance } from 'antd/es/form';

/**
 * Role 表单字段定义
 *
 * 系统角色只允许编辑名称和描述。
 */
export const roleFormFields: FieldDefinition[] = [
  {
    key: 'name',
    label: '角色名称',
    type: 'input',
    required: true,
    placeholder: '请输入角色名称',
  },
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '请输入角色描述',
  },
];

/**
 * StandardForm 模式：声明式表单组件
 */
export function RoleForm({ form, isEdit }: { form: FormInstance; isEdit: boolean }) {
  return (
    <>
      <StandardForm form={form} isEdit={isEdit} fields={roleFormFields} />
      {isEdit && (
        <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
          注：系统角色的标识（slug）和层级（level）不可修改
        </div>
      )}
    </>
  );
}
