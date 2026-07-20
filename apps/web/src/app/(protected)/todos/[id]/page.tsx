'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Todo {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  dueDate?: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-neutral-100 text-neutral-600' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-600' },
};

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: '低', color: 'bg-neutral-100 text-neutral-600' },
  1: { label: '中', color: 'bg-orange-100 text-orange-600' },
  2: { label: '高', color: 'bg-red-100 text-red-600' },
};

export default function TodoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchTodo();
  }, [id]);

  const fetchTodo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<Todo>(`/todos/${id}`);
      if (res.success) {
        setTodo(res.data);
      } else {
        setError(res.message || '加载失败');
        if (!res.success) setTimeout(() => router.push('/todos'), 2000);
      }
    } catch {
      setError('网络错误');
      setTimeout(() => router.push('/todos'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async () => {
    if (!todo) return;
    try {
      await apiClient.put(`/todos/${todo.id}`, { isCompleted: !todo.isCompleted });
      fetchTodo();
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!todo || !confirm('确认删除这条待办事项？')) return;
    try {
      await apiClient.delete(`/todos/${todo.id}`);
      router.push('/todos');
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-neutral-400">
        加载中...
      </div>
    );
  }

  if (error || !todo) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error || 'Todo 不存在'}
      </div>
    );
  }

  const statusInfo = STATUS_MAP[todo.status] || STATUS_MAP.pending;
  const priorityInfo = PRIORITY_LABELS[todo.priority] || PRIORITY_LABELS[0];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/todos" className="hover:text-brand-600">
          待办事项
        </Link>
        <span>/</span>
        <span className="text-neutral-900">详情</span>
      </div>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={toggleComplete}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
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
          <div>
            <h1
              className={`text-2xl font-bold ${
                todo.isCompleted ? 'text-neutral-400 line-through' : 'text-neutral-900'
              }`}
            >
              {todo.title}
            </h1>
          </div>
        </div>

        <button onClick={handleDelete} className="text-sm text-neutral-400 hover:text-red-500">
          删除
        </button>
        <Link
          href={`/todos/${todo.id}/edit`}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 shadow-sm hover:bg-neutral-50"
        >
          编辑
        </Link>
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        <span className={`rounded px-2 py-1 text-xs font-medium ${priorityInfo.color}`}>
          优先级: {priorityInfo.label}
        </span>
        {todo.isCompleted && (
          <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
            已完成
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mt-6 space-y-4">
        {todo.description && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-700">描述</h3>
            <p className="mt-1 text-sm text-neutral-600 whitespace-pre-wrap">{todo.description}</p>
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-neutral-700">详细信息</h3>
          <dl className="mt-2 divide-y divide-neutral-100">
            {todo.dueDate && (
              <div className="flex justify-between py-2">
                <dt className="text-sm text-neutral-500">截止日期</dt>
                <dd className="text-sm text-neutral-900">
                  {new Date(todo.dueDate).toLocaleDateString('zh-CN')}
                </dd>
              </div>
            )}
            <div className="flex justify-between py-2">
              <dt className="text-sm text-neutral-500">创建时间</dt>
              <dd className="text-sm text-neutral-900">
                {new Date(todo.createdAt).toLocaleString('zh-CN')}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm text-neutral-500">更新时间</dt>
              <dd className="text-sm text-neutral-900">
                {new Date(todo.updatedAt).toLocaleString('zh-CN')}
              </dd>
            </div>
            {todo.completedAt && (
              <div className="flex justify-between py-2">
                <dt className="text-sm text-neutral-500">完成时间</dt>
                <dd className="text-sm text-neutral-900">
                  {new Date(todo.completedAt).toLocaleString('zh-CN')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
