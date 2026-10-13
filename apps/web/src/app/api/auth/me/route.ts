import { NextRequest, NextResponse } from 'next/server';

import { API_UPSTREAM as API_BASE } from '@/lib/api-upstream';

/**
 * GET /api/auth/me — 服务端代理后端鉴权接口。
 * accessToken 是 httpOnly cookie（客户端 JS 不可读，防 XSS），
 * 必须在此读取并转发为 Authorization header。
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json(data ?? { success: false, message: 'Unauthorized' }, {
      status: res.status,
    });
  }

  return NextResponse.json(data);
}
