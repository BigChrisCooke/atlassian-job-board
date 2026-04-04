import type { APIRoute } from 'astro';
import jobsData from '../data/jobs.json';

// Paths that should NOT appear in the sitemap.
// Always pair with noindex={true} on the corresponding <Layout> call.
const NOINDEX_PATHS: string[] = [
  // '/private/',
  // '/drafts/some-post/',
];

interface SitemapPage {
  path: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

const PAGES: SitemapPage[] = [
  { path: '/',      changefreq: 'monthly', priority: '1.0' },
  { path: '/jobs/', changefreq: 'weekly',  priority: '0.9', lastmod: jobsData.generatedAt },
  // Add new pages here as the site grows
];

export const GET: APIRoute = ({ site }) => {
  const baseUrl = (site ?? 'https://www.togetha.group').toString().replace(/\/$/, '');

  const indexable = PAGES.filter(
    (p) =>
      !NOINDEX_PATHS.includes(p.path) &&
      !p.path.includes('/private/') &&
      !p.path.includes('/draft/')
  );

  const urls = indexable
    .map(
      (p) => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
