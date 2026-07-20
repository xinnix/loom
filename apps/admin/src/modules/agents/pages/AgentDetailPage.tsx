import { StandardDetailPage } from '../../../shared/components/StandardDetailPage';
import { agentDetailFields } from '../components';

/**
 * Agent 详情页
 *
 * 使用 StandardDetailPage 配置驱动模式，
 * 字段定义在 AgentDetail.tsx 中集中管理。
 */
export function AgentDetailPage() {
  return (
    <StandardDetailPage
      resource="agents"
      title="AI 助手详情"
      headerType="simple"
      backPath="/agents"
      backLabel="返回列表"
      titleField="name"
      statusField="isActive"
      statusConfig={{
        true: { color: 'green', text: '启用' },
        false: { color: 'red', text: '禁用' },
      }}
      fields={agentDetailFields}
      column={2}
      maxWidth={800}
    />
  );
}
