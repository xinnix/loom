'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <div className="md:hidden text-lg font-bold text-brand-600">Roundtable</div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600">{user?.firstName || user?.username}</span>
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        >
          退出
        </button>
      </div>
    </header>
  );
}
