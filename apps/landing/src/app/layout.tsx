import type { Metadata } from 'next';
import { inter } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roundtable — 全栈 SaaS 脚手架',
  description:
    '开箱即用的全栈管理系统脚手架。NestJS + React + tRPC + Prisma，内置 Auth、RBAC、支付、Admin，数天即可上线。',
  openGraph: {
    title: 'Roundtable — 全栈 SaaS 脚手架',
    description: '开箱即用的全栈管理系统脚手架，数天即可上线。',
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
