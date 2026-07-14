'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (form.password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    setLoading(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-8 shadow-sm border border-neutral-200"
    >
      <h2 className="text-xl font-semibold text-neutral-900">注册</h2>
      <p className="mt-1 text-sm text-neutral-500">创建新账号</p>

      {error && (
        <div className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{error}</div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-neutral-700">
            用户名
          </label>
          <input
            id="username"
            type="text"
            required
            value={form.username}
            onChange={update('username')}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            placeholder="请输入用户名"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            placeholder="请输入邮箱"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            密码
          </label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={update('password')}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            placeholder="至少 6 位"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
            确认密码
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            placeholder="再次输入密码"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '注册中...' : '注册'}
      </button>

      <p className="mt-4 text-center text-sm text-neutral-500">
        已有账号？{' '}
        <a href="/login" className="font-medium text-brand-600 hover:text-brand-500">
          登录
        </a>
      </p>
    </form>
  );
}
