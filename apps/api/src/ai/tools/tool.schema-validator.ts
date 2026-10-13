import type { ToolParameterSchema } from '@loom/shared';

export interface SchemaValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * JSON Schema 子集校验器（零依赖）。
 *
 * 支持关键字：type / properties / required / enum / items / description。
 * 用途：结构化输出校验（outputFormat: json）与工具参数的防御性二次校验
 * （pi-agent-core 的 AJV 校验之后，executor 作为安全边界再确认一次）。
 */
export function validateAgainstSchema(
  value: unknown,
  schema: ToolParameterSchema | undefined,
  path = '$',
): SchemaValidationResult {
  if (!schema) return { ok: true, errors: [] };
  const errors: string[] = [];
  check(value, schema, path, errors);
  return { ok: errors.length === 0, errors };
}

function check(value: unknown, schema: ToolParameterSchema, path: string, errors: string[]): void {
  if (schema.enum) {
    if (typeof value !== 'string' || !schema.enum.includes(value)) {
      errors.push(`${path} 必须是 ${schema.enum.map((e) => JSON.stringify(e)).join('|')} 之一`);
      return;
    }
  }

  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') errors.push(`${path} 必须是字符串`);
      break;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) errors.push(`${path} 必须是数字`);
      break;
    case 'integer':
      if (!Number.isInteger(value)) errors.push(`${path} 必须是整数`);
      break;
    case 'boolean':
      if (typeof value !== 'boolean') errors.push(`${path} 必须是布尔值`);
      break;
    case 'array': {
      if (!Array.isArray(value)) {
        errors.push(`${path} 必须是数组`);
        break;
      }
      if (schema.items) {
        value.forEach((item, i) => check(item, schema.items!, `${path}[${i}]`, errors));
      }
      break;
    }
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`${path} 必须是对象`);
        break;
      }
      const obj = value as Record<string, unknown>;
      for (const key of schema.required ?? []) {
        if (!(key in obj)) errors.push(`${path} 缺少必填字段: ${key}`);
      }
      for (const [key, sub] of Object.entries(schema.properties ?? {})) {
        if (key in obj) check(obj[key], sub, `${path}.${key}`, errors);
      }
      break;
    }
  }
}
