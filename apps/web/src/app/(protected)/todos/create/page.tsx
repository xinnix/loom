'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

export default function CreateTodoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await apiClient.post('/todos', {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
      });

      if (res.success) {
        router.push('/todos');
      } else {
        setError(res.message || '创建失败');
      }
    } catch (err: any) {
      setError(err?.message || '网络错误');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/todos" className="hover:text-brand-600">
          待办事项
        </Link>
        <span>/</span>
        <span className="text-neutral-900">新建</span>
      </div>

      <h1 className="mt-2 text-2xl font-bold text-neutral-900">新建待办事项</h1>

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
            placeholder="输入待办事项标题..."
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            autoFocus
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
            placeholder="添加详细描述（可选）"
            rows={3}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
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
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '创建中...' : '创建'}
          </button>
          <Link
            href="/todos"
            className="rounded-lg border border-neutral-300 px-6 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
