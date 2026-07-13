import type { Metadata } from 'next';
import { inter } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenCode Scaffold — Agent-Centric 全栈开发框架',
  description:
    '不止是脚手架。19 个内置 Skill、11 个 Command、7 个自动化 Hook，让 Claude Code 成为你的全职开发搭档。NestJS + React + tRPC + Prisma，克隆即开工。',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'OpenCode Scaffold — Agent-Centric 全栈开发框架',
    description:
      'Agent-Centric 全栈开发框架。内置完整 Skill/Command/Hook 生态，Claude Code 驱动的全栈开发体验。',
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
