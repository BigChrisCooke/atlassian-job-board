export function buildJobId(sourceSlug: string, title: string, location: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(sourceSlug)}-${slug(title)}-${slug(location)}`.slice(0, 120);
}

export function normaliseLocation(raw: string): string {
  const s = raw.toLowerCase();
  if (!s) return 'other';
  if (s.includes('remote')) return 'remote';
  if (s.match(/australia|sydney|melbourne|brisbane|canberra|perth|adelaide/)) return 'australia';
  if (s.match(/new zealand|auckland|wellington/)) return 'new zealand';
  if (s.match(/singapore/)) return 'singapore';
  if (s.match(/hong kong/)) return 'hong kong';
  if (s.match(/new york|san francisco|austin|seattle|boston|chicago|usa|united states/)) return 'usa';
  if (s.match(/london|manchester|edinburgh|uk|united kingdom/)) return 'uk';
  if (s.match(/amsterdam|berlin|munich|stuttgart|paris|frankfurt|europe/)) return 'europe';
  if (s.match(/india|bangalore|bengaluru|hyderabad|pune|mumbai/)) return 'india';
  return 'other';
}
