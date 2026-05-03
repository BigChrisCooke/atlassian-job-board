// Stable-ID dedup key: `<namespace>-<slug(sourceId)>`. Use whichever ID the
// ATS itself assigns (Greenhouse numeric id, Lever uuid, URL slug for custom
// pages). When a company renames a role its title-slug would change but the
// underlying ID does not — preserves firstSeen across renames.
export function buildStableJobId(namespace: string, sourceId: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(namespace)}-${slug(sourceId)}`.slice(0, 160);
}

// Scrapers that read text from HTML attributes (og:title, etc.) get raw entity
// references like "&amp;" — Astro then re-escapes them, so the rendered card
// shows the literal "&amp;" and substring search across the ampersand fails.
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&'); // last, otherwise "&amp;lt;" → "<"
}

export function normaliseLocation(raw: string): string[] {
  const s = raw.toLowerCase().trim();
  if (!s) return ['other'];

  const tags: string[] = [];

  const isRemote = /remote|work from home|wfh/.test(s);
  const isAustralia = /australia|sydney|melbourne|brisbane|canberra|perth|adelaide/.test(s);
  const isNZ = /new zealand|auckland|wellington/.test(s);
  const isSingapore = /singapore/.test(s);
  const isHongKong = /hong kong/.test(s);
  const isUSA = /\b(usa|united states|united states of america|north america)\b|new york|san francisco|austin|seattle|boston|chicago|salt lake city|denver|atlanta|los angeles|dallas|portland|raleigh|philadelphia|cincinnati|cincinatti|tempe|somerville|,\s*(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)\b/.test(s);
  const isCanada = /canada|toronto|vancouver|montreal|calgary|ottawa/.test(s);
  const isUK = /\b(uk|united kingdom)\b|london|manchester|edinburgh|birmingham|bristol|leeds/.test(s);
  const isIndia = /india|bangalore|bengaluru|hyderabad|pune|mumbai|chennai|ahmedabad/.test(s);
  const isEurope = /europe|amsterdam|berlin|munich|münchen|stuttgart|sindelfingen|koblenz|paris|frankfurt|cologne|köln|brussels|madrid|barcelona|stockholm|gothenburg|helsinki|oslo|copenhagen|københavn|zürich|zurich|vienna|wien|warsaw|wrocław|krakow|kraków|prague|budapest|bucharest|sofia|lisbon|lisboa|porto|lyon|toulouse|marseille|nantes|lille|dijon|levallois|strasbourg|bordeaux|luxembourg|esch-sur-alzette|awans|dublin|galway|ireland|germany|france|spain|italy|netherlands|belgium|sweden|norway|denmark|finland|switzerland|austria|poland|portugal|czech|hungary|romania|bulgaria|serbia|croatia|slovakia|ukraine|,\s*(be|lu|nl)\b|\/nl\b|idf|île-de-france|rhône|bretagne|occitanie|hauts-de-france|bourgogne|provence|normandy|vojvodina|vlaams|vlaanderen|lower silesian/.test(s);
  const isLatam = /latam|latin america|south america|brazil|brasil|argentina|colombia|chile|mexico|peru/.test(s);
  // Asia bucket covers Asian markets without their own dedicated tag (Singapore,
  // Hong Kong, India already have their own).
  const isAsia = /\basia\b|philippines|manila|malaysia|kuala lumpur|indonesia|jakarta|thailand|bangkok|vietnam|hanoi|ho chi minh|japan|tokyo|south korea|seoul|taiwan|taipei|uae|united arab emirates|dubai|abu dhabi|saudi arabia|riyadh|qatar|doha|israel|tel aviv/.test(s);
  const isAfrica = /africa|egypt|cairo|tunisia|tunis|morocco|casablanca|rabat|kenya|nairobi|nigeria|lagos|south africa|johannesburg|cape town|ghana|accra|ethiopia|addis ababa/.test(s);

  if (isRemote) tags.push('remote');
  if (isAustralia) tags.push('australia');
  if (isNZ) tags.push('new zealand');
  if (isSingapore) tags.push('singapore');
  if (isHongKong) tags.push('hong kong');
  if (isUSA) tags.push('usa');
  if (isCanada) tags.push('canada');
  if (isUK) tags.push('uk');
  if (isIndia) tags.push('india');
  if (isEurope) tags.push('europe');
  if (isLatam) tags.push('latam');
  if (isAsia) tags.push('asia');
  if (isAfrica) tags.push('africa');

  return tags.length > 0 ? tags : ['other'];
}
