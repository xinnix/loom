import * as path from 'node:path';
import type { NextConfig } from 'next';

// 子路径部署（如 GitHub Pages https://<user>.github.io/<repo>/）时注入，本地默认根路径
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
  // monorepo：追踪根定为仓库根。changelog 页构建期读根 CHANGELOG.md，不限定会把整个项目误 trace
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
