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
    const isCloud = Boolean(process.env.VERCEL || process.env.RENDER);
    const defaultTarget = isCloud
      ? 'https://apna-ghar-2-4766.onrender.com/api/v1/:path*'
      : 'http://localhost:4000/api/v1/:path*';
    const proxyTarget = process.env.BACKEND_API_URL || defaultTarget;

    return [
      {
        source: '/api/v1/:path*',
        destination: proxyTarget,
      },
    ];
  },
};

export default nextConfig;
