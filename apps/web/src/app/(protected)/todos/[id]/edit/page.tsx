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
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function EditTodoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (id) fetchTodo();
  }, [id]);

  const fetchTodo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<Todo>(`/todos/${id}`);
      if (res.success && res.data) {
        const todo = res.data;
        setTitle(todo.title);
        setDescription(todo.description || '');
        setStatus(todo.status);
        setPriority(todo.priority);
        setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '');
      } else {
        setError(res.message || '加载失败');
      }
    } catch (err: any) {
      setError(err?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await apiClient.put(`/todos/${id}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
      });

      if (res.success) {
        router.push(`/todos/${id}`);
      } else {
        setError(res.message || '保存失败');
      }
    } catch (err: any) {
      setError(err?.message || '网络错误');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-neutral-400">
        加载中...
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/todos" className="hover:text-brand-600">
          待办事项
        </Link>
        <span>/</span>
        <Link href={`/todos/${id}`} className="hover:text-brand-600">
          详情
        </Link>
        <span>/</span>
        <span className="text-neutral-900">编辑</span>
      </div>

      <h1 className="mt-2 text-2xl font-bold text-neutral-900">编辑待办事项</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
            描述
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-neutral-700">
            状态
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">优先级</label>
          <div className="mt-2 flex gap-3">
            {[
              {
                value: 0,
                label: '低',
                color: 'bg-neutral-100 text-neutral-600 border-neutral-300',
              },
              { value: 1, label: '中', color: 'bg-orange-100 text-orange-600 border-orange-300' },
              { value: 2, label: '高', color: 'bg-red-100 text-red-600 border-red-300' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  priority === opt.value
                    ? `${opt.color} ring-2 ring-offset-1`
                    : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-700">
            截止日期
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <Link
            href={`/todos/${id}`}
            className="rounded-lg border border-neutral-300 px-6 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
