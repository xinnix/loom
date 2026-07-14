import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Loom — Agent-Centric 全栈开发框架',
  description:
    'Loom 将 AI Agent、后端、前端与数据库精密编织为完整的全栈开发体验。NestJS + React + tRPC + Prisma，克隆即开工。',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Loom — Agent-Centric 全栈开发框架',
    description: 'Loom 将 AI Agent、后端、前端与数据库精密编织为完整的全栈开发框架。',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0,1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-primary/20 bg-white">
        {children}
      </body>
    </html>
  );
}
