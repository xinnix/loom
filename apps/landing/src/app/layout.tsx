import type { Metadata } from 'next';
import { inter } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Loom — Agent-Centric 全栈开发框架',
  description:
    'Loom 将 AI Agent、后端、前端与数据库精密编织为完整的全栈开发体验。NestJS + React + tRPC + Prisma，克隆即开工。',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Loom — Agent-Centric 全栈开发框架',
    description: 'Loom，即织布机 — 将 AI Agent、后端、前端与数据库精密编织为完整的全栈开发框架。',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="bg-white text-neutral-900 font-body antialiased">{children}</body>
    </html>
  );
}
