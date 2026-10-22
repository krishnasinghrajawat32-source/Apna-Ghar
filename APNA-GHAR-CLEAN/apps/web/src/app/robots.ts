import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://apnaghar.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/property/', '/mess/'],
        disallow: [
          '/admin/',
          '/student/',
          '/owner/',
          '/mess/dashboard',
          '/booking/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
