import { createUserClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import {
  ArticleRow,
  displaySummary,
  PreferenceWeights,
  rankFeedArticles,
} from '../_shared/feed.ts';
import { topicsFromOnboarding } from '../_shared/topics.ts';

const FEED_LIMIT = 20;
const CANDIDATE_LIMIT = 100;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await createUserClient(req);
  if (auth instanceof Response) return auth;
  const { supabase, userId } = auth;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('swipe_count, personalization_enabled, onboarding_topics')
    .eq('user_id', userId)
    .single();

  const { data: prefsRow } = await supabase
    .from('user_preferences')
    .select('topic_weights, source_weights')
    .eq('user_id', userId)
    .single();

  const prefs: PreferenceWeights = {
    topic_weights: (prefsRow?.topic_weights as Record<string, number>) ?? {},
    source_weights: (prefsRow?.source_weights as Record<string, number>) ?? {},
  };

  const { data: swipes } = await supabase
    .from('user_swipes')
    .select('article_id, direction, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const swipedIds = new Set((swipes ?? []).map((s) => s.article_id));
  const recentLeft = (swipes ?? [])
    .filter((s) => s.direction === 'left')
    .slice(0, 10);

  const { data: leftArticles } = await supabase
    .from('articles')
    .select('topics')
    .in(
      'id',
      recentLeft.map((s) => s.article_id).filter(Boolean),
    );

  const recentLeftTopics = new Set<string>();
  for (const a of leftArticles ?? []) {
    for (const t of a.topics ?? []) recentLeftTopics.add(t);
  }

  const { data: candidates, error } = await supabase
    .from('articles')
    .select(
      'id, url, title, summary, source_name, source_domain, image_url, published_at, topics, summary_status',
    )
    .in('summary_status', ['done', 'failed'])
    .order('published_at', { ascending: false })
    .limit(CANDIDATE_LIMIT);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const available = (candidates ?? []).filter(
    (a) => !swipedIds.has(a.id),
  ) as ArticleRow[];

  const swipeCount = profile?.swipe_count ?? 0;
  const personalizationEnabled =
    profile?.personalization_enabled ?? swipeCount >= 20;
  const onboardingTopicSet = topicsFromOnboarding(
    profile?.onboarding_topics ?? [],
  );

  const feed = rankFeedArticles(
    available,
    prefs,
    recentLeftTopics,
    swipeCount,
    onboardingTopicSet,
    FEED_LIMIT,
  );

  const articles = feed.map((a) => ({
    ...a,
    display_summary: displaySummary(a),
    favicon_url: a.source_domain
      ? `https://www.google.com/s2/favicons?domain=${a.source_domain}&sz=64`
      : null,
  }));

  return jsonResponse({
    articles,
    swipe_count: swipeCount,
    personalization_enabled: personalizationEnabled,
    just_personalized: personalizationEnabled && swipeCount === 20,
  });
});
