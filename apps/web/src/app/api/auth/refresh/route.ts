import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * POST /api/auth/refresh — 服务端代理 token 刷新。
 * refreshToken 在 httpOnly cookie 里（客户端 JS 不可读），在此读取并转发，
 * 刷新成功后重新下发 httpOnly cookie（与 login route 同模式）。
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;
  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !data.data?.accessToken) {
    return NextResponse.json(data ?? { success: false, message: '刷新失败' }, {
      status: res.status === 200 ? 401 : res.status,
    });
  }

  const response = NextResponse.json(data);
  response.cookies.set('accessToken', data.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1h
  });
  if (data.data.refreshToken) {
    response.cookies.set('refreshToken', data.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}
