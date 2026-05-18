import { createUserClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { clampWeight } from '../_shared/feed.ts';

const SWIPE_THRESHOLD = 20;
const DELTA = 1;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await createUserClient(req);
  if (auth instanceof Response) return auth;
  const { supabase, userId } = auth;

  const body = await req.json();
  const { articleId, direction, extraTopicPenalty } = body as {
    articleId?: string;
    direction?: 'left' | 'right';
    extraTopicPenalty?: boolean;
  };

  if (!articleId || (direction !== 'left' && direction !== 'right')) {
    return jsonResponse({ error: 'Invalid articleId or direction' }, 400);
  }

  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, topics, source_name')
    .eq('id', articleId)
    .single();

  if (articleError || !article) {
    return jsonResponse({ error: 'Article not found' }, 404);
  }

  const delta = direction === 'right' ? DELTA : -DELTA;
  const extraPenalty = extraTopicPenalty && direction === 'left' ? -2 : 0;

  const { data: existingSwipe } = await supabase
    .from('user_swipes')
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle();

  await supabase.from('user_swipes').upsert(
    {
      user_id: userId,
      article_id: articleId,
      direction,
    },
    { onConflict: 'user_id,article_id' },
  );

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('topic_weights, source_weights')
    .eq('user_id', userId)
    .single();

  const topicWeights = {
    ...((prefs?.topic_weights as Record<string, number>) ?? {}),
  };
  const sourceWeights = {
    ...((prefs?.source_weights as Record<string, number>) ?? {}),
  };

  for (const t of article.topics ?? []) {
    const current = topicWeights[t] ?? 0;
    const change = delta + (extraPenalty && t === article.topics?.[0] ? extraPenalty : 0);
    topicWeights[t] = clampWeight(current + change);
  }

  const sourceKey = (article.source_name ?? '').toLowerCase();
  sourceWeights[sourceKey] = clampWeight(
    (sourceWeights[sourceKey] ?? 0) + delta,
  );

  await supabase
    .from('user_preferences')
    .update({
      topic_weights: topicWeights,
      source_weights: sourceWeights,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('swipe_count')
    .eq('user_id', userId)
    .single();

  const newCount = existingSwipe
    ? (profile?.swipe_count ?? 0)
    : (profile?.swipe_count ?? 0) + 1;
  const personalizationEnabled = newCount >= SWIPE_THRESHOLD;

  await supabase
    .from('user_profiles')
    .update({
      swipe_count: newCount,
      personalization_enabled: personalizationEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return jsonResponse({
    ok: true,
    swipe_count: newCount,
    personalization_enabled: personalizationEnabled,
    just_personalized: newCount === SWIPE_THRESHOLD,
  });
});
