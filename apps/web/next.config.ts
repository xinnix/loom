import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@loom/shared'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_UPSTREAM_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
