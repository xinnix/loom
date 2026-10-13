import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/todos'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  // 业务 API（经 rewrite 转发后端）：httpOnly cookie 注入为后端所需的 Bearer header。
  // 客户端 JS 读不到 httpOnly cookie，无法自行携带 Authorization（防 XSS 设计的前提）。
  if (pathname.startsWith('/api/') && accessToken) {
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return NextResponse.next({ request: { headers } });
  }

  // 已登录用户访问 auth 页面 → 重定向到 dashboard
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 未登录用户访问 protected 页面 → 重定向到 login
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/todos/:path*',
    '/login',
    '/register',
    '/api/:path*',
  ],
};
