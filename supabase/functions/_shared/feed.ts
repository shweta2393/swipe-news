export interface ArticleRow {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_domain: string | null;
  image_url: string | null;
  published_at: string | null;
  topics: string[];
  summary_status: string;
}

export interface PreferenceWeights {
  topic_weights: Record<string, number>;
  source_weights: Record<string, number>;
}

const WEIGHT_CLAMP = 10;
const RECENT_LEFT_PENALTY = 3;

export function clampWeight(w: number): number {
  return Math.max(-WEIGHT_CLAMP, Math.min(WEIGHT_CLAMP, w));
}

export function recencyScore(article: ArticleRow, now = Date.now()): number {
  const published = article.published_at
    ? new Date(article.published_at).getTime()
    : now;
  const hoursAgo = (now - published) / (1000 * 60 * 60);
  return Math.max(0, 48 - hoursAgo);
}

export function preferenceScore(
  article: ArticleRow,
  prefs: PreferenceWeights,
  recentLeftTopics: Set<string>,
): number {
  let topicScore = 0;
  for (const t of article.topics ?? []) {
    topicScore += (prefs.topic_weights[t] ?? 0) * 2;
    if (recentLeftTopics.has(t)) {
      topicScore -= RECENT_LEFT_PENALTY;
    }
  }

  const sourceKey = article.source_name?.toLowerCase() ?? '';
  const sourceScore = (prefs.source_weights[sourceKey] ?? 0) * 1.5;

  return topicScore + sourceScore;
}

export function scoreArticle(
  article: ArticleRow,
  prefs: PreferenceWeights,
  recentLeftTopics: Set<string>,
  now = Date.now(),
): number {
  return (
    recencyScore(article, now) +
    preferenceScore(article, prefs, recentLeftTopics)
  );
}

const SWIPE_THRESHOLD = 20;

/** Rank feed: preferences apply immediately; stronger weight after 20 swipes. */
export function rankFeedArticles(
  available: ArticleRow[],
  prefs: PreferenceWeights,
  recentLeftTopics: Set<string>,
  swipeCount: number,
  onboardingTopicSet: string[],
  limit: number,
): ArticleRow[] {
  const learningFactor = Math.min(swipeCount / SWIPE_THRESHOLD, 1);
  const fullyPersonalized = swipeCount >= SWIPE_THRESHOLD;

  const scored = available.map((article) => {
    const recency = recencyScore(article);
    const pref = preferenceScore(article, prefs, recentLeftTopics);

    let score: number;
    if (fullyPersonalized) {
      score = recency + pref;
    } else {
      // Swipes affect feed during learning (0–40% pref weight ramping to 20 swipes)
      const prefWeight = 0.15 + learningFactor * 0.55;
      const recencyWeight = 1 - prefWeight;
      score = recency * recencyWeight + pref * prefWeight;

      if (
        onboardingTopicSet.length > 0 &&
        (article.topics ?? []).some((t) => onboardingTopicSet.includes(t))
      ) {
        score += 4 * (1 - learningFactor * 0.5);
      }
    }

    return { article, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.article);
}

export function blendColdStart(
  trending: ArticleRow[],
  topicMatched: ArticleRow[],
  limit: number,
): ArticleRow[] {
  const trendingCount = Math.ceil(limit * 0.7);
  const topicCount = limit - trendingCount;
  const seen = new Set<string>();
  const result: ArticleRow[] = [];

  for (const a of trending.slice(0, trendingCount)) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      result.push(a);
    }
  }
  for (const a of topicMatched.slice(0, topicCount)) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      result.push(a);
    }
  }
  for (const a of trending) {
    if (result.length >= limit) break;
    if (!seen.has(a.id)) {
      seen.add(a.id);
      result.push(a);
    }
  }
  for (const a of topicMatched) {
    if (result.length >= limit) break;
    if (!seen.has(a.id)) {
      seen.add(a.id);
      result.push(a);
    }
  }

  return result.slice(0, limit);
}

export function displaySummary(article: ArticleRow): string {
  if (article.summary_status === 'done' && article.summary?.trim()) {
    const summary = article.summary.trim();
    if (summary !== article.title?.trim()) {
      return summary;
    }
  }
  if (article.summary_status === 'failed') {
    return article.title;
  }
  return article.title ?? 'Summary loading…';
}
