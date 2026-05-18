import { SUMMARY_PROMPT_VERSION } from './topics.ts';

export type SummarizeMode = 'local' | 'llm' | 'auto';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_SUMMARY_CHARS = 220;

/** Deterministic summary from title + description — no API cost. */
export function localSummarize(title: string, description: string | null): string {
  if (!description?.trim()) {
    return title;
  }

  const cleaned = description.replace(/\s+/g, ' ').trim();
  const sentenceParts = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [cleaned];
  let summary = sentenceParts
    .slice(0, 2)
    .join(' ')
    .trim();

  if (!summary) {
    summary = cleaned;
  }

  if (summary.length > MAX_SUMMARY_CHARS) {
    const cut = summary.slice(0, MAX_SUMMARY_CHARS - 1);
    const lastSpace = cut.lastIndexOf(' ');
    summary = (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '…';
  }

  return summary;
}

export function resolveSummarizeMode(): SummarizeMode {
  const raw = (Deno.env.get('SUMMARIZE_MODE') ?? 'local').toLowerCase();
  if (raw === 'llm' || raw === 'auto' || raw === 'local') return raw;
  return 'local';
}

export function getBatchSize(mode: SummarizeMode): number {
  const env = Deno.env.get('SUMMARIZE_BATCH_SIZE');
  if (env) {
    const n = parseInt(env, 10);
    if (!Number.isNaN(n) && n > 0) return Math.min(n, mode === 'local' ? 100 : 10);
  }
  return mode === 'local' ? 50 : 3;
}

export function getRequestDelayMs(): number {
  const env = Deno.env.get('SUMMARIZE_REQUEST_DELAY_MS');
  if (env) {
    const n = parseInt(env, 10);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return 1500;
}

export function isQuotaError(status: number, body: string): boolean {
  if (status === 429) return true;
  if (status === 402) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('rate_limit') ||
    lower.includes('insufficient_quota') ||
    lower.includes('billing') ||
    lower.includes('exceeded your current')
  );
}

export async function llmSummarize(
  title: string,
  description: string,
  sourceName: string,
  systemPrompt: string,
  apiKey: string,
): Promise<{ summary: string } | { quotaExceeded: true } | { error: string }> {
  const userContent = `Title: ${title}
Description: ${description}
Source: ${sourceName}`;

  const llmRes = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 80,
      temperature: 0.2,
    }),
  });

  const bodyText = await llmRes.text();

  if (!llmRes.ok) {
    if (isQuotaError(llmRes.status, bodyText)) {
      return { quotaExceeded: true };
    }
    return { error: bodyText };
  }

  try {
    const llmData = JSON.parse(bodyText);
    const summary =
      llmData.choices?.[0]?.message?.content?.trim() ?? localSummarize(title, description);
    return { summary };
  } catch {
    return { error: 'Invalid OpenAI response' };
  }
}

export function buildSummaryUpdate(summary: string) {
  return {
    summary,
    summary_status: 'done' as const,
    summary_prompt_version: SUMMARY_PROMPT_VERSION,
  };
}

export async function sleep(ms: number) {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}
