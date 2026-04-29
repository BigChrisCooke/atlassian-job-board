import type { Anomaly, ScrapeReport } from './types.js';

// GitHub Models is OpenAI-compatible. Free for personal accounts, authed via
// GITHUB_TOKEN; the workflow needs `permissions: models: read` to use it.
const MODELS_ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const MODEL_ID = 'openai/gpt-4o-mini';

const SYSTEM_PROMPT = `You write short, plain-English retrospectives for a weekly job-scraper health report.
Given a flagged anomaly and 1-3 web search snippets about the company, write ONE paragraph (40-80 words) explaining:
- whether the company appears to still be hiring for Atlassian-related roles based on the snippets
- whether the anomaly is more likely a real change at the company OR a scraper failure
- a concrete suggestion for the next step (e.g. "verify selectors", "check rate limit", "looks like genuine churn")
Plain prose. No bullet points, no markdown headers. Be direct.`;

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function userPromptFor(a: Anomaly): string {
  const lines: string[] = [];
  lines.push(`Source: ${a.source}`);
  lines.push(`Anomaly: ${a.kind}`);
  lines.push(`Detail: ${a.message}`);
  if (a.error) lines.push(`Error: ${a.error}`);
  if (a.context && a.context.results.length > 0) {
    lines.push('');
    lines.push('Web search results:');
    a.context.results.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.title}`);
      lines.push(`   ${r.url}`);
      if (r.description) lines.push(`   ${r.description}`);
    });
  } else {
    lines.push('');
    lines.push('(No web search context available — base your reply on the anomaly alone.)');
  }
  return lines.join('\n');
}

async function callModel(token: string, anomaly: Anomaly): Promise<string | null> {
  const res = await fetch(MODELS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_ID,
      temperature: 0.3,
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPromptFor(anomaly) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[models] HTTP ${res.status} for "${anomaly.source}" — ${body.slice(0, 200)}`);
    return null;
  }

  const data = (await res.json()) as ChatResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

// Mutates the report in place: attaches a synthesis string to each anomaly.
// No-op when no auth token is available, so local runs and CI without the
// `models: read` permission keep working unchanged.
export async function synthesizeAnomalies(report: ScrapeReport): Promise<void> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_MODELS_TOKEN;
  if (!token) {
    if (report.anomalies.length > 0) {
      console.log('[models] No GITHUB_TOKEN — skipping anomaly synthesis');
    }
    return;
  }

  const targets = report.anomalies.filter((a) => a.kind !== 'duplicate_ids');
  if (targets.length === 0) return;

  console.log(`\n[models] Synthesizing ${targets.length} anomal${targets.length === 1 ? 'y' : 'ies'}...`);

  for (const anomaly of targets) {
    try {
      const synthesis = await callModel(token, anomaly);
      if (synthesis) anomaly.synthesis = synthesis;
    } catch (err) {
      console.warn(`[models] failed for "${anomaly.source}": ${(err as Error).message}`);
    }
  }
}
