'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  aiApi,
  runAgentStream,
  aiErrorMessage,
  type AgentInfo,
  type AgentSession,
  type AgentMessageItem,
  type RunEvent,
} from '@/lib/ai-api';

/**
 * AI 助手示范页（ADR-006 D4 会话消费面，与 Todo 示范同定位）：
 * 左侧会话列表（按 agent 过滤），右侧流式聊天窗口。
 * 会话绑定单一 agent；切换 agent 重新拉取会话列表。
 */
export default function AiChatPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [agentSlug, setAgentSlug] = useState('');
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState<AgentMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // agent 列表（user 身份，服务端已按 audience 过滤）
  useEffect(() => {
    if (!user) return;
    aiApi
      .listAgents()
      .then((res) => {
        const list = res.data ?? [];
        setAgents(list);
        if (list.length > 0) setAgentSlug(list[0].slug);
      })
      .catch((err) => setError(aiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [user]);

  // 会话列表跟随 agent
  const refreshSessions = useCallback(async (slug: string) => {
    if (!slug) return;
    const res = await aiApi.listSessions(slug);
    setSessions(res.data ?? []);
  }, []);

  useEffect(() => {
    if (agentSlug) refreshSessions(agentSlug).catch((err) => setError(aiErrorMessage(err)));
  }, [agentSlug, refreshSessions]);

  // 选中会话 → 加载消息
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    aiApi
      .getSession(activeSessionId)
      .then((res) => setMessages(res.data?.messages ?? []))
      .catch((err) => setError(aiErrorMessage(err)));
  }, [activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const handleNewSession = async () => {
    if (!agentSlug) return;
    setError('');
    try {
      const res = await aiApi.createSession(agentSlug);
      if (res.data) {
        setSessions((prev) => [res.data as AgentSession, ...prev]);
        setActiveSessionId(res.data.id);
        setMessages([]);
      }
    } catch (err) {
      setError(aiErrorMessage(err));
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await aiApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId('');
        setMessages([]);
      }
    } catch (err) {
      setError(aiErrorMessage(err));
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeSessionId || streaming) return;
    setError('');
    setInput('');

    // 本地乐观追加用户消息；流式 assistant 气泡单独渲染
    const optimistic: AgentMessageItem = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setStreaming(true);
    setStreamText('');

    const abort = new AbortController();
    try {
      let output = '';
      await runAgentStream({
        slug: agentSlug,
        input: { message: text },
        sessionId: activeSessionId,
        signal: abort.signal,
        onEvent: (event: RunEvent) => {
          if (event.type === 'content' && event.text) {
            setStreamText((prev) => prev + event.text);
          } else if (event.type === 'run_end') {
            output = event.output ?? '';
          } else if (event.type === 'error') {
            setError(event.message ?? 'Agent 运行失败');
          }
        },
      });
      // 流结束：流式气泡落定为正式 assistant 消息
      setStreamText('');
      if (output) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: output,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      refreshSessions(agentSlug).catch(() => {});
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(aiErrorMessage(err));
      setStreamText('');
    } finally {
      setStreaming(false);
    }
  };

  const activeAgent = agents.find((a) => a.slug === agentSlug);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-neutral-400">加载中…</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* 会话列表 */}
      <aside className="flex w-64 shrink-0 flex-col rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 p-3">
          <select
            value={agentSlug}
            onChange={(e) => {
              setAgentSlug(e.target.value);
              setActiveSessionId('');
            }}
            className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
          >
            {agents.length === 0 && <option value="">无可用 Agent</option>}
            {agents.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleNewSession}
            disabled={!agentSlug}
            className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-40"
          >
            + 新会话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 && (
            <p className="p-3 text-xs text-neutral-400">暂无会话，点击「新会话」开始</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-neutral-50 ${
                activeSessionId === s.id ? 'bg-brand-50 text-brand-700' : 'text-neutral-700'
              }`}
              onClick={() => setActiveSessionId(s.id)}
            >
              <span className="truncate">{s.title || '新会话'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(s.id);
                }}
                className="ml-2 hidden text-neutral-400 hover:text-red-500 group-hover:block"
                aria-label="删除会话"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* 聊天窗口 */}
      <section className="flex flex-1 flex-col rounded-xl border border-neutral-200 bg-white">
        <header className="border-b border-neutral-100 px-4 py-3">
          <h1 className="text-sm font-medium text-neutral-800">{activeAgent?.name || 'AI 助手'}</h1>
          {activeAgent?.description && (
            <p className="mt-0.5 text-xs text-neutral-400">{activeAgent.description}</p>
          )}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!activeSessionId && (
            <p className="mt-16 text-center text-sm text-neutral-400">选择或新建一个会话开始对话</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-brand-600 text-white'
                    : 'rounded-bl-sm bg-neutral-100 text-neutral-800'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-2 text-sm text-neutral-800">
                {streamText || '思考中…'}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="border-t border-neutral-100 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend();
              }}
              placeholder={activeSessionId ? '输入消息，回车发送' : '先新建或选择会话'}
              disabled={!activeSessionId || streaming}
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400 disabled:bg-neutral-50"
            />
            <button
              onClick={handleSend}
              disabled={!activeSessionId || streaming || !input.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {streaming ? '发送中…' : '发送'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
