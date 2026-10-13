/**
 * Prompt 模板渲染（ADR-005 演进原则：仅两种点路径变量，无控制流）。
 *
 * - {{input.x}}      → 触发时 body.input 的字段
 * - {{nodes.<id>.output}} → 前置节点输出
 *
 * 对象/数组值 JSON.stringify；未命中变量置空串并收集 warning（写入 nodeTrace）。
 */
const VAR_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export interface RenderResult {
  text: string;
  warnings: string[];
}

export function renderTemplate(
  template: string,
  scope: { input?: unknown; nodes?: Record<string, string> },
): RenderResult {
  const warnings: string[] = [];
  const text = template.replace(VAR_RE, (_match, pathExpr: string) => {
    const value = lookup(pathExpr, scope);
    if (value === undefined) {
      warnings.push(`模板变量未命中: {{${pathExpr}}}（已置空）`);
      return '';
    }
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  });
  return { text, warnings };
}

function lookup(
  pathExpr: string,
  scope: { input?: unknown; nodes?: Record<string, string> },
): unknown {
  const segments = pathExpr.split('.');
  const root = segments[0];
  if (root === 'input') {
    let cur: unknown = scope.input;
    for (const seg of segments.slice(1)) {
      if (cur === null || typeof cur !== 'object') return undefined;
      cur = (cur as Record<string, unknown>)[seg];
    }
    return cur;
  }
  if (root === 'nodes') {
    // 仅支持 nodes.<id>.output 两种规范形式之一；id 可含下划线
    const nodeId = segments[1];
    if (!nodeId || segments[2] !== 'output') return undefined;
    return scope.nodes?.[nodeId];
  }
  return undefined;
}
