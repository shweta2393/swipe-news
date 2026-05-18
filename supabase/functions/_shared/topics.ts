export const ONBOARDING_TOPICS = [
  'technology',
  'business',
  'sports',
  'science',
  'health',
  'entertainment',
  'politics',
  'world',
] as const;

const CATEGORY_MAP: Record<string, string[]> = {
  technology: ['technology'],
  business: ['business'],
  sports: ['sports'],
  science: ['science'],
  health: ['health'],
  entertainment: ['entertainment'],
  politics: ['politics', 'general'],
  world: ['general', 'world'],
};

export function mapNewsApiCategory(category?: string): string[] {
  if (!category) return ['general'];
  const normalized = category.toLowerCase();
  if (ONBOARDING_TOPICS.includes(normalized as (typeof ONBOARDING_TOPICS)[number])) {
    return [normalized];
  }
  return ['general'];
}

export function topicsFromOnboarding(selected: string[]): string[] {
  const set = new Set<string>();
  for (const t of selected) {
    const mapped = CATEGORY_MAP[t.toLowerCase()];
    if (mapped) mapped.forEach((m) => set.add(m));
  }
  return [...set];
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export const SUMMARY_PROMPT_VERSION = 'v1';

export const SUMMARY_SYSTEM_PROMPT = `You are a neutral news summarizer. Using ONLY the title and description below,
write 1-2 factual sentences (max 120 characters total if possible). Do not add opinions, predictions, or facts not present.
If insufficient detail, say "Limited details available" and stick to title facts.`;
