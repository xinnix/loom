import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/todos'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

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
  ],
};
