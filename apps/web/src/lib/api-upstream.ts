/**
 * Next 服务端 → 后端 API 的上游地址（auth API routes 服务端 fetch 用）。
 *
 * 与浏览器端基址（api-client 的 NEXT_PUBLIC_API_URL，恒为空 = 同源 /api/*）
 * 解耦：后端不在 3000 时设 API_UPSTREAM_URL 即可，不影响浏览器同源链路
 * （httpOnly cookie + middleware 注入 Bearer）。
 */
export const API_UPSTREAM =
  process.env.API_UPSTREAM_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
