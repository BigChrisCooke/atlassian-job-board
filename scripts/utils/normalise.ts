export function buildJobId(sourceSlug: string, title: string, location: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(sourceSlug)}-${slug(title)}-${slug(location)}`.slice(0, 120);
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
  const isEurope = /europe|amsterdam|berlin|munich|münchen|stuttgart|paris|frankfurt|cologne|köln|brussels|madrid|barcelona|stockholm|gothenburg|helsinki|oslo|copenhagen|københavn|zürich|zurich|zurich|vienna|wien|warsaw|wrocław|krakow|kraków|prague|budapest|bucharest|lisbon|lisboa|porto|lyon|toulouse|marseille|nantes|lille|dijon|levallois|strasbourg|bordeaux|luxembourg|dublin|galway|ireland|germany|france|spain|italy|netherlands|belgium|sweden|norway|denmark|finland|switzerland|austria|poland|portugal|czech|hungary|romania|bulgaria|serbia|croatia|slovakia|ukraine|\/nl|, nl\b|\bnl\b/, idf|île-de-france|rhône|bretagne|occitanie|hauts-de-france|bourgogne|provence|normandy|vojvodina|vlaams|vlaanderen|lower silesian/.test(s);
  const isLatam = /latam|latin america|south america|brazil|brasil|argentina|colombia|chile|mexico|peru/.test(s);

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

  return tags.length > 0 ? tags : ['other'];
}
