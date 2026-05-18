import { createServiceClient, verifyCronOrService } from '../_shared/auth.ts';
import { corsHeaders, handleCors, jsonResponse } from '../_shared/cors.ts';
import { extractDomain, mapNewsApiCategory } from '../_shared/topics.ts';

const NEWS_API = 'https://newsapi.org/v2/top-headlines';
const CATEGORIES = [
  'technology',
  'business',
  'sports',
  'science',
  'health',
  'entertainment',
  'general',
];

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!verifyCronOrService(req)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const apiKey = Deno.env.get('NEWS_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'NEWS_API_KEY not configured' }, 500);
  }

  const supabase = createServiceClient();
  let inserted = 0;

  for (const category of CATEGORIES) {
    const params = new URLSearchParams({
      country: 'us',
      category,
      pageSize: '20',
      apiKey,
    });

    const res = await fetch(`${NEWS_API}?${params}`);
    if (!res.ok) {
      console.error(`NewsAPI error for ${category}:`, await res.text());
      continue;
    }

    const data = await res.json();
    const articles: NewsArticle[] = data.articles ?? [];

    for (const a of articles) {
      if (!a.url || !a.title || a.title === '[Removed]') continue;

      const row = {
        url: a.url,
        title: a.title,
        description: a.description ?? null,
        source_name: a.source?.name ?? 'Unknown',
        source_domain: extractDomain(a.url),
        image_url: a.urlToImage,
        published_at: a.publishedAt,
        topics: mapNewsApiCategory(category),
        summary_status: 'pending' as const,
      };

      const { error } = await supabase
        .from('articles')
        .upsert(row, { onConflict: 'url', ignoreDuplicates: true });

      if (!error) inserted++;
    }
  }

  return jsonResponse({ ok: true, inserted });
});
