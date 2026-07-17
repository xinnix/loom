import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOne } from '@refinedev/core';
import { Card, Input, Button, List, Avatar, Space, Typography, Empty, App } from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  tool?: string;
  toolInput?: string;
  createdAt: number;
}

interface Conversation {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export const AgentChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const { data: agentData } = useOne({
    resource: 'agents',
    id: id!,
  }) as any;

  const agent = (agentData as any)?.data;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchConversations = async () => {
    if (!id) return;
    setLoadingConversations(true);
    try {
      const { data } = (await (window as any).__trpcClient?.agents?.getConversations?.query({
        agentId: id!,
        limit: 50,
      })) || { data: [] };
      setConversations(data || []);
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!id || !conversationId) return;
    try {
      const result = await (window as any).__trpcClient?.agents?.getMessages?.query({
        agentId: id!,
        conversationId,
        limit: 100,
      });
      if (result?.data) {
        const chatMessages: ChatMessage[] = [];
        for (const msg of result.data) {
          chatMessages.push({
            id: msg.id,
            role: 'user',
            content: msg.query,
            createdAt: msg.created_at * 1000,
          });
          chatMessages.push({
            id: msg.id + '-answer',
            role: 'assistant',
            content: msg.answer,
            createdAt: msg.created_at * 1000,
          });
        }
        setMessages(chatMessages);
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewConversation = () => {
    setActiveConversationId('');
    setMessages([]);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id);
    fetchMessages(conv.id);
  };

  const handleSend = async () => {
    if (!query.trim() || !id || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      createdAt: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setQuery('');
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(`/api/agents/${id}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query: query.trim(),
          conversationId: activeConversationId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr);

              switch (event.event) {
                case 'agent_message':
                case 'message':
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        content: last.content + (event.answer || ''),
                      };
                    }
                    return updated;
                  });
                  break;

                case 'agent_thought':
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        thought: event.thought,
                        tool: event.tool,
                        toolInput: event.tool_input,
                      };
                    }
                    return updated;
                  });
                  break;

                case 'message_end':
                  if (event.conversation_id && !activeConversationId) {
                    setActiveConversationId(event.conversation_id);
                    fetchConversations();
                  }
                  break;

                case 'error':
                  message.error(event.message || '对话出错');
                  break;
              }
            } catch {
              // SSE stream errors are non-fatal
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        message.error('对话失败: ' + error.message);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div style={{ height: 'calc(100vh - 112px)', display: 'flex', gap: 16 }}>
      {/* Conversation List */}
      <Card
        style={{ width: 260, flexShrink: 0 }}
        styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="primary" icon={<PlusOutlined />} block onClick={handleNewConversation}>
            新对话
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <List
            loading={loadingConversations}
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  background: conv.id === activeConversationId ? '#e6f7ff' : undefined,
                }}
                onClick={() => handleSelectConversation(conv)}
              >
                <Text ellipsis style={{ width: '100%' }}>
                  {conv.name || '新对话'}
                </Text>
              </List.Item>
            )}
            locale={{ emptyText: '暂无对话' }}
          />
        </div>
      </Card>

      {/* Chat Area */}
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/agents')} />
          <RobotOutlined style={{ fontSize: 18 }} />
          <Text strong>{agent?.name || 'Agent'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {activeConversationId ? '对话中' : '新对话'}
          </Text>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {messages.length === 0 ? (
            <Empty description="发送消息开始对话" style={{ marginTop: 100 }} />
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 16,
                }}
              >
                <Space align="start" style={{ maxWidth: '70%' }}>
                  {msg.role === 'assistant' && <Avatar size="small" icon={<RobotOutlined />} />}
                  <div>
                    {msg.role === 'assistant' && msg.thought && (
                      <div
                        style={{
                          background: '#fff7e6',
                          border: '1px solid #ffe58f',
                          borderRadius: 8,
                          padding: '4px 12px',
                          marginBottom: 4,
                          fontSize: 12,
                          color: '#ad6800',
                        }}
                      >
                        {msg.tool && <Text strong>🔧 {msg.tool}</Text>}
                        {msg.thought && <div>{msg.thought}</div>}
                      </div>
                    )}
                    <div
                      style={{
                        background: msg.role === 'user' ? '#1677ff' : '#f0f0f0',
                        color: msg.role === 'user' ? '#fff' : '#000',
                        borderRadius: 8,
                        padding: '8px 12px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content || (isStreaming && msg.role === 'assistant' ? '...' : '')}
                    </div>
                  </div>
                  {msg.role === 'user' && <Avatar size="small" icon={<UserOutlined />} />}
                </Space>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: 8,
          }}
        >
          <Input.TextArea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入消息..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isStreaming}
            style={{ flex: 1 }}
          />
          {isStreaming ? (
            <Button onClick={handleStop}>停止</Button>
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!query.trim()}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
