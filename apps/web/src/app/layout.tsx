import type { Metadata } from 'next';
import { inter } from '@/lib/fonts';
import { AuthProvider } from '@/providers/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roundtable',
  description: '用户端 Web 应用',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="bg-white text-neutral-900 font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
