import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://apnaghar.in';
  const lastModified = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mess`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Verified Accommodations (Dynamic slugs)
  const propertySlugs = [
    'stanza-living-north-campus',
    'scholars-den-residency',
    'oxford-student-hostel',
    'green-valley-girls-pg',
    'campus-comfort-residence',
  ];

  const propertyRoutes: MetadataRoute.Sitemap = propertySlugs.map((slug) => ({
    url: `${baseUrl}/property/${slug}`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // College campus proximity discovery hubs
  const collegeSlugs = [
    'delhi-university-north-campus',
    'iit-delhi-hauz-khas',
    'bits-pilani-campus',
    'anna-university-guindy',
    'pune-university-ganeshkhind',
  ];

  const collegeRoutes: MetadataRoute.Sitemap = collegeSlugs.map((slug) => ({
    url: `${baseUrl}/search?college=${slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Mess outlets
  const messSlugs = [
    'annapurna-student-mess-north-campus',
    'shree-krishna-pure-veg-dining',
    'campus-kitchen-bistro',
  ];

  const messRoutes: MetadataRoute.Sitemap = messSlugs.map((slug) => ({
    url: `${baseUrl}/mess/${slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...propertyRoutes, ...collegeRoutes, ...messRoutes];
}
