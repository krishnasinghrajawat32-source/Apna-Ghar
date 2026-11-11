import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@apna-ghar/shared-types', '@apna-ghar/shared-constants'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const proxyTarget = isDev
      ? 'http://localhost:4000/api/v1/:path*'
      : (process.env.BACKEND_API_URL || 'https://apna-ghar-2-4766.onrender.com/api/v1/:path*');

    return [
      {
        source: '/api/v1/:path*',
        destination: proxyTarget,
      },
    ];
  },
};

export default nextConfig;
