import { createServiceClient, verifyCronOrService } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { SUMMARY_SYSTEM_PROMPT } from '../_shared/topics.ts';
import {
  buildSummaryUpdate,
  getBatchSize,
  getRequestDelayMs,
  llmSummarize,
  localSummarize,
  resolveSummarizeMode,
  sleep,
  type SummarizeMode,
} from '../_shared/summarize.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!verifyCronOrService(req)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const mode = resolveSummarizeMode();
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const useLlm = mode === 'llm' || mode === 'auto';

  if (useLlm && !openaiKey) {
    return jsonResponse(
      {
        error:
          'OPENAI_API_KEY not configured. Set SUMMARIZE_MODE=local for free-tier (no OpenAI).',
      },
      500,
    );
  }

  const supabase = createServiceClient();
  const batchSize = getBatchSize(mode);
  const delayMs = getRequestDelayMs();

  const { data: pending, error } = await supabase
    .from('articles')
    .select('id, title, description, source_name')
    .in('summary_status', ['pending', 'failed'])
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  let processed = 0;
  let failed = 0;
  let localFallbacks = 0;
  let quotaExceeded = false;
  let effectiveMode: SummarizeMode = mode;

  for (const article of pending ?? []) {
    if (quotaExceeded) break;

    const title = article.title ?? 'Untitled';
    const description = article.description?.trim() ?? '';

    if (!description) {
      await supabase
        .from('articles')
        .update(buildSummaryUpdate(title))
        .eq('id', article.id);
      processed++;
      continue;
    }

    const shouldUseLlm =
      effectiveMode === 'llm' ||
      (effectiveMode === 'auto' && openaiKey && !quotaExceeded);

    if (!shouldUseLlm) {
      const summary = localSummarize(title, description);
      await supabase
        .from('articles')
        .update(buildSummaryUpdate(summary))
        .eq('id', article.id);
      processed++;
      localFallbacks++;
      continue;
    }

    const result = await llmSummarize(
      title,
      description,
      article.source_name ?? 'Unknown',
      SUMMARY_SYSTEM_PROMPT,
      openaiKey!,
    );

    if ('quotaExceeded' in result) {
      quotaExceeded = true;
      effectiveMode = 'local';
      const summary = localSummarize(title, description);
      await supabase
        .from('articles')
        .update(buildSummaryUpdate(summary))
        .eq('id', article.id);
      processed++;
      localFallbacks++;
      continue;
    }

    if ('error' in result) {
      console.error('OpenAI error for', article.id, result.error);
      const summary = localSummarize(title, description);
      await supabase
        .from('articles')
        .update(buildSummaryUpdate(summary))
        .eq('id', article.id);
      processed++;
      localFallbacks++;
      continue;
    }

    await supabase
      .from('articles')
      .update(buildSummaryUpdate(result.summary))
      .eq('id', article.id);
    processed++;

    if (delayMs > 0 && pending && pending.indexOf(article) < pending.length - 1) {
      await sleep(delayMs);
    }
  }

  const { count: remaining } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .in('summary_status', ['pending', 'failed']);

  return jsonResponse({
    ok: true,
    mode: effectiveMode,
    processed,
    failed,
    local_fallbacks: localFallbacks,
    quota_exceeded: quotaExceeded,
    remaining_pending: remaining ?? 0,
    hint: quotaExceeded
      ? 'OpenAI quota hit; used local summaries. Set SUMMARIZE_MODE=local to skip API calls, or re-run to process remaining articles.'
      : remaining && remaining > 0
        ? `Re-run curl to process next batch (${remaining} left).`
        : undefined,
  });
});
