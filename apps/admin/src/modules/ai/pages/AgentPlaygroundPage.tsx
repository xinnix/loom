import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Input, Tag, Typography, Alert, Space } from 'antd';
import { PlayCircleOutlined, ClearOutlined } from '@ant-design/icons';
import { ssePost } from '../../../shared/utils/ssePost';

const { Text } = Typography;

interface TimelineNode {
  nodeId: string;
  nodeType?: string;
  contents: string[];
  toolCalls: { name: string; args?: unknown; ok?: boolean; ms?: number }[];
  finished: boolean;
}

/**
 * Agent Playground：SSE 流式调试（D6 事件协议渲染）。
 * 左栏输入 JSON，右栏节点时间线（chat 流式文本 / loop 工具轨迹）。
 */
export function AgentPlaygroundPage() {
  const { slug } = useParams();
  const [inputText, setInputText] = useState('{\n  "question": "我有哪些未完成的待办？"\n}');
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [usage, setUsage] = useState<{ totalTokens: number; calls: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);

  const run = () => {
    let input: unknown;
    try {
      input = JSON.parse(inputText);
    } catch {
      setError('输入不是合法 JSON');
      return;
    }
    setError(null);
    setNodes([]);
    setUsage(null);
    setFinalOutput(null);
    setRunning(true);

    void ssePost({
      url: `/api/ai/agents/${slug}/run`,
      body: { input },
      onEvent: (data: any) => {
        switch (data.type) {
          case 'node_start':
            setNodes((prev) => [
              ...prev,
              {
                nodeId: data.nodeId,
                nodeType: data.nodeType,
                contents: [],
                toolCalls: [],
                finished: false,
              },
            ]);
            break;
          case 'content':
            setNodes((prev) =>
              prev.map((n) =>
                n.nodeId === data.nodeId && !n.finished
                  ? { ...n, contents: [...n.contents, data.text] }
                  : n,
              ),
            );
            break;
          case 'tool_call':
            setNodes((prev) =>
              prev.map((n) =>
                n.nodeId === data.nodeId
                  ? { ...n, toolCalls: [...n.toolCalls, { name: data.name, args: data.args }] }
                  : n,
              ),
            );
            break;
          case 'tool_result':
            setNodes((prev) =>
              prev.map((n) => {
                if (n.nodeId !== data.nodeId) return n;
                const toolCalls = [...n.toolCalls];
                for (let i = toolCalls.length - 1; i >= 0; i -= 1) {
                  if (toolCalls[i].name === data.name && toolCalls[i].ok === undefined) {
                    toolCalls[i] = { ...toolCalls[i], ok: data.ok, ms: data.ms };
                    break;
                  }
                }
                return { ...n, toolCalls };
              }),
            );
            break;
          case 'node_end':
            setNodes((prev) =>
              prev.map((n) => (n.nodeId === data.nodeId ? { ...n, finished: true } : n)),
            );
            break;
          case 'run_end':
            setUsage({ totalTokens: data.usage?.totalTokens ?? 0, calls: data.usage?.calls ?? 0 });
            setFinalOutput(data.output);
            break;
          case 'error':
            setError(data.message);
            break;
        }
      },
      onError: (err) => {
        setError(err.message);
        setRunning(false);
      },
      onDone: () => setRunning(false),
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 16 }}>
      <Card title={`输入（${slug}）`} size="small">
        <Input.TextArea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" icon={<PlayCircleOutlined />} loading={running} onClick={run}>
            运行
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setNodes([]);
              setError(null);
              setFinalOutput(null);
              setUsage(null);
            }}
          >
            清空
          </Button>
        </Space>
        {error && <Alert style={{ marginTop: 12 }} type="error" message={error} />}
      </Card>

      <Card
        title="执行时间线"
        size="small"
        extra={
          usage ? (
            <Tag color="blue">
              {usage.calls} 次调用 · {usage.totalTokens} tokens
            </Tag>
          ) : null
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nodes.length === 0 && !running && <Text type="secondary">点击「运行」开始调试</Text>}
          {nodes.map((node) => (
            <Card
              key={node.nodeId}
              size="small"
              title={
                <Space>
                  <Tag color={node.nodeType === 'loop' ? 'purple' : 'cyan'}>
                    {node.nodeType ?? 'node'}
                  </Tag>
                  <span>{node.nodeId}</span>
                  {node.finished && <Tag color="success">完成</Tag>}
                </Space>
              }
            >
              {node.toolCalls.map((tc, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <Tag color={tc.ok === undefined ? 'processing' : tc.ok ? 'green' : 'red'}>
                    🔧 {tc.name}
                  </Tag>
                  {tc.ms !== undefined && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {tc.ms}ms
                    </Text>
                  )}
                  {tc.args !== undefined && (
                    <pre
                      style={{
                        fontSize: 11,
                        background: '#f6f6f6',
                        padding: 4,
                        borderRadius: 4,
                        margin: '4px 0 0',
                      }}
                    >
                      {JSON.stringify(tc.args)}
                    </pre>
                  )}
                </div>
              ))}
              {node.contents.length > 0 && (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{node.contents.join('')}</div>
              )}
            </Card>
          ))}
          {finalOutput !== null && (
            <Card size="small" title="最终输出">
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{finalOutput}</div>
            </Card>
          )}
          {running && nodes.every((n) => n.finished) && <Text type="secondary">运行中…</Text>}
        </div>
      </Card>
    </div>
  );
}
