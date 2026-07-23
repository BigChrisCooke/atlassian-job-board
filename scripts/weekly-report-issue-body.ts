import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Anomaly, ScrapeReport, SourceResult } from './types.js';

const REPORT_URL = 'https://jobs.apwide.com/scrape-report';
const REPORTS_URL =
  'https://github.com/BigChrisCooke/atlassian-job-board/issues?q=label%3Aweekly-report';

const report = JSON.parse(
  readFileSync(path.resolve('src/data/scrape-report.json'), 'utf8'),
) as ScrapeReport;

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  const utc = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
    hour12: false,
  }).format(date);
  const bangkok = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
    hour12: false,
  }).format(date);
  return `${utc} UTC (${bangkok} Bangkok)`;
}

function anomalyHeading(anomaly: Anomaly): string {
  const labels: Record<Anomaly['kind'], string> = {
    failed: 'Scraper failed',
    silent_zero: 'Silent zero',
    runaway: 'Unexpected growth',
    huge_drop: 'Large drop',
    cooldown: 'Cooldown',
    duplicate_ids: 'Duplicate IDs',
  };
  return `${labels[anomaly.kind]} — ${anomaly.source}`;
}

function appendAnomaly(lines: string[], anomaly: Anomaly): void {
  lines.push(`### ⚠️ ${anomalyHeading(anomaly)}`);
  lines.push('');
  lines.push(anomaly.message);

  if (anomaly.synthesis) {
    lines.push('');
    lines.push(`**Assessment:** ${anomaly.synthesis}`);
  }

  if (anomaly.error) {
    lines.push('');
    lines.push('<details><summary>Error details</summary>');
    lines.push('');
    lines.push('```text');
    lines.push(anomaly.error);
    lines.push('```');
    lines.push('</details>');
  }

  if (anomaly.context?.results.length) {
    lines.push('');
    lines.push(`**External evidence** for \`${anomaly.context.query}\`:`);
    for (const result of anomaly.context.results) {
      lines.push(`- [${result.title}](${result.url})`);
    }
  }

  lines.push('');
}

function changedSources(
  sources: SourceResult[],
  direction: 'up' | 'down',
): Array<SourceResult & { delta: number }> {
  return sources
    .filter((source) => source.prevCount !== undefined)
    .map((source) => ({
      ...source,
      delta: source.count - (source.prevCount ?? 0),
    }))
    .filter((source) => (direction === 'up' ? source.delta > 0 : source.delta < 0))
    .sort((a, b) =>
      direction === 'up'
        ? b.delta - a.delta || a.name.localeCompare(b.name)
        : a.delta - b.delta || a.name.localeCompare(b.name),
    );
}

function appendChanges(
  lines: string[],
  heading: string,
  sources: Array<SourceResult & { delta: number }>,
): void {
  lines.push(`### ${heading}`);
  lines.push('');

  if (sources.length === 0) {
    lines.push('No source-level changes.');
    lines.push('');
    return;
  }

  lines.push('| Source | Group | Previous | Current | Change |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const source of sources) {
    lines.push(
      `| ${source.name} | ${source.group} | ${source.prevCount} | ${source.count} | ${signed(source.delta)} |`,
    );
  }
  lines.push('');
}

function appendQuietSources(lines: string[], sources: SourceResult[]): void {
  const quiet = sources
    .filter(
      (source) =>
        source.status === 'ok' &&
        source.count === 0 &&
        (source.prevCount === undefined || source.prevCount === 0),
    )
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

  lines.push('## Quiet sources');
  lines.push('');
  if (quiet.length === 0) {
    lines.push('No sources returned a stable zero.');
    lines.push('');
    return;
  }

  lines.push(
    `<details><summary>${quiet.length} sources returned zero without a regression</summary>`,
  );
  lines.push('');
  let currentGroup = '';
  for (const source of quiet) {
    if (source.group !== currentGroup) {
      if (currentGroup) lines.push('');
      currentGroup = source.group;
      lines.push(`**${currentGroup}**`);
      lines.push('');
    }
    lines.push(`- ${source.name}`);
  }
  lines.push('');
  lines.push('</details>');
  lines.push('');
}

const totalDelta =
  report.prevTotalActive === undefined
    ? undefined
    : report.totalActive - report.prevTotalActive;
const increases = changedSources(report.sources, 'up');
const decreases = changedSources(report.sources, 'down');
const lines: string[] = [];

lines.push('## Headline');
lines.push('');
lines.push(
  [
    `**${report.totalActive} active jobs**`,
    totalDelta === undefined
      ? 'no previous total'
      : `${signed(totalDelta)} vs previous ${report.prevTotalActive}`,
    `${report.anomalies.length} anomal${report.anomalies.length === 1 ? 'y' : 'ies'}`,
    `scrape completed ${formatGeneratedAt(report.generatedAt)}`,
  ].join(' · '),
);
lines.push('');
lines.push(
  `${report.totalFresh} fresh listings were returned across ${report.sources.length} configured sources in ${(report.durationMs / 1000).toFixed(1)} seconds.`,
);
lines.push('');

lines.push('## Regressions and anomalies');
lines.push('');
if (report.anomalies.length === 0) {
  lines.push('No anomalies were detected in this run.');
  lines.push('');
} else {
  for (const anomaly of report.anomalies) appendAnomaly(lines, anomaly);
}

lines.push('## Source changes');
lines.push('');
appendChanges(lines, 'Increases', increases);
appendChanges(lines, 'Decreases', decreases);
appendQuietSources(lines, report.sources);

lines.push('---');
lines.push('');
lines.push(`[View the full scrape report](${REPORT_URL})`);
lines.push('');
lines.push(`[Browse all weekly reports](${REPORTS_URL})`);

process.stdout.write(`${lines.join('\n')}\n`);
