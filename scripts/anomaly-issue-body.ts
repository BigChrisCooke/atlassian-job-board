import { readFileSync } from 'fs';
import path from 'path';
import type { ScrapeReport } from './types.js';

// Emits a Markdown body for a GitHub issue summarising this run's anomalies.
// Called from .github/workflows/scrape-and-deploy.yml when the report has any
// anomalies, so the maintainer gets pinged without having to check the URL.
const report = JSON.parse(
  readFileSync(path.resolve('src/data/scrape-report.json'), 'utf8'),
) as ScrapeReport;

const lines: string[] = [];
lines.push(`**Generated:** ${report.generatedAt}`);
lines.push(`**Active jobs:** ${report.totalActive}${report.prevTotalActive !== undefined ? ` (was ${report.prevTotalActive})` : ''}`);
lines.push(`**Run duration:** ${(report.durationMs / 1000).toFixed(1)}s`);
lines.push('');
lines.push(`## ${report.anomalies.length} anomal${report.anomalies.length === 1 ? 'y' : 'ies'}`);
lines.push('');

for (const a of report.anomalies) {
  lines.push(`### ${a.kind} — ${a.source}`);
  lines.push(a.message);
  if (a.error) {
    lines.push('');
    lines.push('```');
    lines.push(a.error);
    lines.push('```');
  }
  if (a.synthesis) {
    lines.push('');
    lines.push(`**Sanity check:** ${a.synthesis}`);
  }
  if (a.context && a.context.results.length > 0) {
    lines.push('');
    lines.push(`Search results for \`${a.context.query}\`:`);
    a.context.results.forEach((r) => lines.push(`- [${r.title}](${r.url})`));
  }
  lines.push('');
}

lines.push('---');
lines.push('Full report: https://jobs.apwide.com/scrape-report');

process.stdout.write(lines.join('\n') + '\n');
