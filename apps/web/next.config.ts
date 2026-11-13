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
      ? 'https://apna-ghar-2-4766.onrender.com/api/v1'
      : 'http://localhost:4000/api/v1';
    const configuredBackendUrl = process.env.BACKEND_API_URL
      ?.replace(/\/:path\*$/, '')
      .replace(/\/+$/, '');
    const proxyTarget = `${configuredBackendUrl || defaultTarget}/:path*`;

    return [
      {
        source: '/api/v1/:path*',
        destination: proxyTarget,
      },
    ];
  },
};

export default nextConfig;
