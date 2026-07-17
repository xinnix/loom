'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Todo {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  dueDate?: string | null;
  isCompleted: boolean;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-neutral-100 text-neutral-600' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-600' },
};

const PRIORITY_MAP: Record<number, string> = {
  0: '低',
  1: '中',
  2: '高',
};

export default function TodosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<Todo[]>('/todos');
      if (res.success) {
        setTodos(res.data || []);
      } else {
        setError(res.message || '加载失败');
      }
    } catch (err: any) {
      setError(err?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    try {
      await apiClient.put(`/todos/${todo.id}`, {
        isCompleted: !todo.isCompleted,
      });
      fetchTodos();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return;
    try {
      await apiClient.delete(`/todos/${id}`);
      fetchTodos();
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">我的待办事项</h1>
        <Link
          href="/todos/create"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          + 新建
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <div className="mt-8 text-center text-neutral-400">加载中...</div>}

      {/* Empty */}
      {!loading && !error && todos.length === 0 && (
        <div className="mt-16 text-center text-neutral-400">
          <p className="text-lg">暂无待办事项</p>
          <Link href="/todos/create" className="mt-2 inline-block text-brand-600 hover:underline">
            创建第一个 Todo
          </Link>
        </div>
      )}

      {/* List */}
      {!loading && todos.length > 0 && (
        <div className="mt-6 space-y-3">
          {todos.map((todo) => {
            const statusInfo = STATUS_MAP[todo.status] || STATUS_MAP.pending;
            return (
              <div
                key={todo.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleComplete(todo)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    todo.isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-neutral-300 hover:border-brand-400'
                  }`}
                >
                  {todo.isCompleted && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => router.push(`/todos/${todo.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        todo.isCompleted ? 'text-neutral-400 line-through' : 'text-neutral-900'
                      }`}
                    >
                      {todo.title}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                    {todo.priority > 0 && (
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-600">
                        {PRIORITY_MAP[todo.priority]}
                      </span>
                    )}
                  </div>
                  {todo.description && (
                    <p className="mt-0.5 truncate text-sm text-neutral-500">{todo.description}</p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="shrink-0 text-sm text-neutral-400 hover:text-red-500"
                >
                  删除
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
