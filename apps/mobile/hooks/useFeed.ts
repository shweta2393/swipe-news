import { useCallback, useState } from 'react';

import { fetchFeed } from '@/lib/api';
import type { FeedArticle } from '@/lib/types';

export function useFeed() {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [personalized, setPersonalized] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFeed();
      setArticles(data.articles);
      setSwipeCount(data.swipe_count);
      setPersonalized(data.personalization_enabled);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTop = useCallback(() => {
    setArticles((prev) => prev.slice(1));
  }, []);

  /** Instant UI update; server reconciles on response. */
  const bumpSwipeCount = useCallback((articleId: string, seenIds: Set<string>) => {
    if (seenIds.has(articleId)) return;
    seenIds.add(articleId);
    setSwipeCount((c) => {
      const next = c + 1;
      if (next >= 20) setPersonalized(true);
      return next;
    });
  }, []);

  return {
    articles,
    loading,
    error,
    swipeCount,
    personalized,
    load,
    removeTop,
    bumpSwipeCount,
    setSwipeCount,
    setPersonalized,
  };
}
