import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Loom — Agent-Centric 全栈开发框架',
  description:
    'Loom 将 AI Agent、后端、前端与数据库精密编织为完整的全栈开发体验。Claude Code / Codex / OpenCode / ZCode 开箱即用，克隆即开工。',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Loom — Agent-Centric 全栈开发框架',
    description:
      'Loom 将 AI Agent、后端、前端与数据库精密编织为完整的全栈开发框架，四大 Agent 开箱即用。',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-canvas font-body-md text-on-surface antialiased min-h-screen relative selection:bg-primary selection:text-on-primary">
        {children}
      </body>
    </html>
  );
}
