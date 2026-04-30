import type { Job, PersonioSource } from '../../types.js';
import { buildJobId, normaliseLocation } from '../../utils/normalise.js';

export async function scrapePersonio(source: PersonioSource): Promise<Job[]> {
  // Personio tenants are reachable on either .com or .de — German customers
  // often canonicalise to .de. Try .com first, fall back to .de on 404.
  const tlds = ['com', 'de'] as const;
  let xml = '';
  let resolvedTld: 'com' | 'de' = 'com';
  let lastStatus = 0;

  for (const tld of tlds) {
    const res = await fetch(`https://${source.slug}.jobs.personio.${tld}/xml`, {
      headers: { 'User-Agent': 'ApwideJobBot/1.0' },
    });
    if (res.ok) {
      xml = await res.text();
      resolvedTld = tld;
      break;
    }
    lastStatus = res.status;
  }

  if (!xml) throw new Error(`Personio ${source.slug}: HTTP ${lastStatus}`);

  const now = new Date().toISOString();

  const positions = xml.match(/<position>[\s\S]*?<\/position>/g) ?? [];

  return positions
    .map((block) => {
      const id = block.match(/<id>(\d+)<\/id>/)?.[1] ?? '';
      const title = block.match(/<name>([^<]+)<\/name>/)?.[1]?.trim() ?? '';
      const office = block.match(/<office>([^<]+)<\/office>/)?.[1]?.trim() ?? '';
      const department = block.match(/<department>([^<]+)<\/department>/)?.[1]?.trim() ?? undefined;
      const schedule = block.match(/<schedule>([^<]+)<\/schedule>/)?.[1]?.trim();
      const createdAt = block.match(/<createdAt>([^<]+)<\/createdAt>/)?.[1] ?? now;

      return {
        id: buildJobId(source.slug, title, office),
        sourceId: id,
        source: source.name,
        title,
        company: source.name,
        location: office,
        locationNormalised: normaliseLocation(office),
        department,
        type: schedule,
        url: `https://${source.slug}.jobs.personio.${resolvedTld}/job/${id}`,
        firstSeen: createdAt,
        lastSeen: now,
        isActive: true,
      };
    })
    .filter((j) => !source.titleFilter || source.titleFilter.test(j.title));
}
