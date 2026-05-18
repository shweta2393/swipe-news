import { supabase } from './supabase';
import type {
  ArticleActionResult,
  FeedResponse,
  SavedArticleItem,
  SwipeResponse,
} from './types';

const functionsUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchFeed(): Promise<FeedResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${functionsUrl}/getFeed`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to load feed');
  }
  return res.json();
}

export async function recordSwipe(
  articleId: string,
  direction: 'left' | 'right',
): Promise<SwipeResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${functionsUrl}/recordSwipe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ articleId, direction }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to record swipe');
  }
  return res.json();
}

/** Faster than Edge Function — uses RLS direct insert. */
export async function saveArticleDirect(
  articleId: string,
): Promise<{ already_saved: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('saved_articles')
    .select('article_id')
    .eq('user_id', user.id)
    .eq('article_id', articleId)
    .maybeSingle();

  if (existing) return { already_saved: true };

  const { error } = await supabase.from('saved_articles').insert({
    user_id: user.id,
    article_id: articleId,
  });

  if (error?.code === '23505') return { already_saved: true };
  if (error) throw error;
  return { already_saved: false };
}

export async function articleAction(
  action: 'save' | 'unsave' | 'less_like_this',
  articleId: string,
): Promise<ArticleActionResult> {
  const headers = await authHeaders();
  const res = await fetch(`${functionsUrl}/articleActions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, articleId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Action failed');
  }
  return res.json();
}

export async function fetchSavedArticles(): Promise<SavedArticleItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('saved_articles')
    .select(
      `
      article_id,
      created_at,
      articles (
        id,
        title,
        url,
        source_name,
        source_domain,
        image_url,
        summary,
        published_at
      )
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SavedArticleItem[];
}

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_topics, swipe_count, personalization_enabled')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function saveOnboardingTopics(topics: string[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_profiles')
    .update({
      onboarding_topics: topics.length ? topics : [],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) throw error;
}
