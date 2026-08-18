// PageSpeed Insights performance sweep across monday.com solution partners.
// Reads PAGESPEED_API_KEY from env. Usage: node scripts/psi-check-monday.mjs
// Runs BOTH mobile + desktop and writes a readable Markdown report.
// Partner list assembled from monday.com Partner-of-the-Year winners + "best of" directories (June 2026).

const KEY = process.env.PAGESPEED_API_KEY;
if (!KEY) { console.error('PAGESPEED_API_KEY not set'); process.exit(1); }

const STRATEGIES = ['mobile', 'desktop'];
const CONCURRENCY = 5;
const REPORT_PATH = 'PSI-PERFORMANCE-REPORT-MONDAY.md';

// company -> marketing homepage (best-effort; resolve check flags bad guesses)
const SITES = {
  'Fruition': 'https://www.fruitionservices.io',
  'The SaaSy People': 'https://www.thesaasypeople.com',
  'AbilityOps': 'https://abilityops.com',
  'Work Perfect': 'https://workperfect.io',
  'Xebia': 'https://xebia.com',
  'Tryve': 'https://tryve.com',
  'TransFunnel': 'https://www.transfunnel.com',
  'Omnitas Consulting': 'https://www.omnitas.com',
  'Red K': 'https://www.redk.net',
  'Task Rhino': 'https://www.taskrhino.ca',
  'Whizzbridge': 'https://www.whizzbridge.com',
  'Empyra': 'https://www.empyra.com',
  'Deviniti': 'https://deviniti.com',
  'Automation Consultants': 'https://www.automation-consultants.com',
  'CarbonWeb': 'https://www.carbonweb.co',
  'Certum Solutions': 'https://www.certumsolutions.com',
  'CXLABS': 'https://www.cxlabs.digital',
  'Polished Geek': 'https://polishedgeek.com',
  'Xertica': 'https://xertica.com',
  'Workflow Magic': 'https://workflowmagic.co',
  'Kick Consulting': 'https://www.kickconsulting.com.au',
  'Simpleday Solutions': 'https://www.simpledaysolutions.com',
  'twodo': 'https://www.twodotech.com',
  'YEP Solutions': 'https://www.yepsolutions.io',
  'OrangeDot Digital': 'https://www.orangedotdigital.com',
  'Alest': 'https://alest.com.br',
  'Aktienow': 'https://aktienow.com',
  'Gaprise': 'https://gaprise.com',
  'DEMICON (tmnxt)': 'https://www.demicon.de',
  'Lucid Day': 'https://lucidday.com',
};

const dv = (a, k) => (a && a[k] && a[k].displayValue) || '';

async function check(company, url, strategy) {
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=${strategy}&key=${KEY}`;
  try {
    const res = await fetch(api);
    const j = await res.json();
    if (j.error) return { company, url, ok: false, error: `${j.error.code} ${j.error.message.slice(0, 70)}` };
    const lr = j.lighthouseResult;
    const a = lr.audits;
    return {
      company, url, ok: true,
      score: Math.round(lr.categories.performance.score * 100),
      lcp: dv(a, 'largest-contentful-paint'),
      fcp: dv(a, 'first-contentful-paint'),
      tbt: dv(a, 'total-blocking-time'),
      cls: dv(a, 'cumulative-layout-shift'),
      si: dv(a, 'speed-index'),
    };
  } catch (e) {
    return { company, url, ok: false, error: e.message.slice(0, 70) };
  }
}

async function sweep(strategy) {
  const entries = Object.entries(SITES);
  const out = {};
  let i = 0;
  async function worker() {
    while (i < entries.length) {
      const idx = i++;
      const [company, url] = entries[idx];
      process.stderr.write(`[${strategy} ${idx + 1}/${entries.length}] ${company}\n`);
      out[company] = await check(company, url, strategy);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out;
}

function band(s) {
  if (s == null) return '—';
  if (s < 50) return '🔴';
  if (s < 70) return '🟠';
  if (s < 90) return '🟡';
  return '🟢';
}

async function run() {
  const data = {};
  for (const s of STRATEGIES) data[s] = await sweep(s);

  const companies = Object.keys(SITES);
  const rows = companies.map(c => {
    const m = data.mobile[c], d = data.desktop[c];
    return {
      company: c,
      mScore: m.ok ? m.score : null,
      dScore: d.ok ? d.score : null,
      m, d,
      worst: Math.min(m.ok ? m.score : 999, d.ok ? d.score : 999),
    };
  });

  const measured = rows.filter(r => r.mScore != null || r.dScore != null).sort((a, b) => a.worst - b.worst);
  const unmeasured = rows.filter(r => r.mScore == null && r.dScore == null);

  const now = new Date().toISOString().slice(0, 10);
  const L = [];
  L.push(`# monday.com Partner Site Performance — PageSpeed Insights`);
  L.push('');
  L.push(`_Generated ${now} · source: Google PageSpeed Insights (Lighthouse), performance category · ${measured.length} sites measured._`);
  L.push('');
  L.push(`Partner list assembled from monday.com's 2026 Partner-of-the-Year winners and reputable "best monday.com partner" directories — a curated set of well-known solution partners, not the full 2,000+ global directory.`);
  L.push('');
  L.push(`Scores are 0–100 (higher = better). Bands: 🔴 0–49 poor · 🟠 50–69 needs work · 🟡 70–89 ok · 🟢 90–100 good.`);
  L.push(`Sites are ranked by their **worst** of the two scores — i.e. who needs help most, first.`);
  L.push('');
  L.push(`## Ranked overview`);
  L.push('');
  L.push('| # | Company | Mobile | Desktop | Gap (D−M) |');
  L.push('|--:|---------|:------:|:-------:|:---------:|');
  measured.forEach((r, i) => {
    const gap = (r.mScore != null && r.dScore != null) ? (r.dScore - r.mScore) : null;
    const gapStr = gap == null ? '—' : (gap > 0 ? `+${gap}` : `${gap}`);
    const flag = (gap != null && Math.abs(gap) >= 25) ? ' ⚠️' : '';
    L.push(`| ${i + 1} | ${r.company} | ${band(r.mScore)} ${r.mScore ?? '—'} | ${band(r.dScore)} ${r.dScore ?? '—'} | ${gapStr}${flag} |`);
  });
  L.push('');
  L.push(`⚠️ = a 25+ point split between mobile and desktop (does well on one, poorly on the other).`);
  L.push('');

  L.push(`## Detailed metrics`);
  L.push('');
  L.push(`Core Web Vitals per device. LCP = how soon the main content appears · TBT = how long the page is frozen by scripts · CLS = how much the layout jumps.`);
  L.push('');
  L.push('| Company | Device | Score | LCP | FCP | TBT | CLS | Speed Index |');
  L.push('|---------|--------|:-----:|-----|-----|-----|-----|-------------|');
  for (const r of measured) {
    for (const [dev, res] of [['Mobile', r.m], ['Desktop', r.d]]) {
      if (res.ok) {
        L.push(`| ${r.company} | ${dev} | ${res.score} | ${res.lcp} | ${res.fcp} | ${res.tbt} | ${res.cls} | ${res.si} |`);
      } else {
        L.push(`| ${r.company} | ${dev} | — | _${res.error}_ | | | | |`);
      }
    }
  }
  L.push('');

  if (unmeasured.length) {
    L.push(`## Could not be measured`);
    L.push('');
    for (const r of unmeasured) {
      L.push(`- **${r.company}** (${SITES[r.company]}) — ${r.m.error || r.d.error || 'unknown error'}`);
    }
    L.push('');
  }

  const fs = await import('node:fs');
  fs.writeFileSync(REPORT_PATH, L.join('\n'));
  console.error(`\nWrote ${REPORT_PATH}`);
}
run();
