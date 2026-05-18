import { createUserClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

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
  const { action, articleId } = body as {
    action?: 'save' | 'unsave' | 'less_like_this';
    articleId?: string;
  };

  if (!articleId || !action) {
    return jsonResponse({ error: 'Invalid action or articleId' }, 400);
  }

  if (action === 'save') {
    const { data: existing } = await supabase
      .from('saved_articles')
      .select('article_id')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ ok: true, saved: true, already_saved: true });
    }

    const { error } = await supabase.from('saved_articles').insert({
      user_id: userId,
      article_id: articleId,
    });

    if (error) {
      if (error.code === '23505') {
        return jsonResponse({ ok: true, saved: true, already_saved: true });
      }
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true, saved: true, already_saved: false });
  }

  if (action === 'unsave') {
    const { error } = await supabase
      .from('saved_articles')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, saved: false });
  }

  if (action === 'less_like_this') {
    const recordUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/recordSwipe`;
    const authHeader = req.headers.get('Authorization')!;
    const res = await fetch(recordUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        articleId,
        direction: 'left',
        extraTopicPenalty: true,
      }),
    });
    const data = await res.json();
    return jsonResponse(data, res.status);
  }

  return jsonResponse({ error: 'Unknown action' }, 400);
});
