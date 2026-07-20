import { StandardDetailPage } from '../../../shared/components/StandardDetailPage';
import { todoDetailFields } from '../components';
import { STATUS_COLORS, STATUS_LABELS } from '../components';

/**
 * Todo 详情页
 *
 * 使用 StandardDetailPage 配置驱动模式，
 * 字段定义在 TodoDetail.tsx 中集中管理。
 *
 * @example 使用方式
 * ```tsx
 * <Route path="todos/:id" element={<TodoDetailPage />} />
 * ```
 */
export function TodoDetailPage() {
  return (
    <StandardDetailPage
      resource="todo"
      title="Todo 详情"
      headerType="simple"
      backPath="/todos"
      backLabel="返回列表"
      titleField="title"
      statusField="status"
      statusConfig={(() => {
        const config: Record<string, { color: string; text: string }> = {};
        for (const [key, color] of Object.entries(STATUS_COLORS)) {
          config[key] = { color, text: STATUS_LABELS[key] || key };
        }
        return config;
      })()}
      fields={todoDetailFields}
      column={2}
      maxWidth={800}
    />
  );
}
