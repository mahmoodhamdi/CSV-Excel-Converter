import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://csv-excel-converter.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'ar'];
  const routes = ['', '/batch', '/transform', '/api-docs', '/history'];

  const sitemap: MetadataRoute.Sitemap = [];

  // Add routes for each locale
  for (const locale of locales) {
    for (const route of routes) {
      sitemap.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  return sitemap;
}
