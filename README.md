# Swipe News

Tinder-style mobile news app: swipe to train your feed, read AI summaries, open full articles at the publisher.

## Stack

- **Client:** Expo (React Native) in [`apps/mobile`](apps/mobile)
- **Backend:** Supabase (Postgres, Auth, Edge Functions)

## Setup

1. Copy `.env.example` to `.env` and fill in keys.
2. Create a [Supabase](https://supabase.com) project and run migrations:

   ```bash
   npx supabase link --project-ref YOUR_REF
   npx supabase db push
   npx supabase functions deploy
   ```

3. Set Edge Function secrets in Supabase Dashboard (Settings → Edge Functions):

   - `NEWS_API_KEY` (required for ingestion)
   - `OPENAI_API_KEY` (optional — only if `SUMMARIZE_MODE=llm` or `auto`)
   - `SUMMARIZE_MODE=local` (recommended on OpenAI free tier; no quota usage)
   - `CRON_SECRET` (optional)

4. Seed articles (run once, then on a schedule):

   ```bash
   curl -X POST "https://YOUR_REF.supabase.co/functions/v1/ingestNews" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

   # Summarize (re-run until remaining_pending is 0)
   curl -X POST "https://YOUR_REF.supabase.co/functions/v1/summarizeBatch" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

   **Free tier / no OpenAI quota:** set `SUMMARIZE_MODE=local` in Edge Function secrets. Summaries are built from the article description (first 1–2 sentences, no API calls). Re-run the curl command if the response shows `remaining_pending` > 0.

   **With OpenAI:** use `SUMMARIZE_MODE=auto` or `llm`, keep `SUMMARIZE_BATCH_SIZE=3` and `SUMMARIZE_REQUEST_DELAY_MS=1500` to stay under rate limits. On quota errors, `auto` falls back to local summaries for that run.

5. Start the app:

   ```bash
   cd apps/mobile
   cp ../../.env.example .env   # or symlink; Expo reads EXPO_PUBLIC_* from here
   npm start
   ```

## Legal & NewsAPI

- We **link out** to publisher URLs; we do not scrape or host full article text.
- Cards always show **Source: {name}**; summaries are generated only from NewsAPI title + description.
- Do **not** bypass paywalls; use in-app browser with fallback to the system browser.
- [NewsAPI.org terms](https://newsapi.org/terms): developer tier is for **non-commercial** use unless you upgrade. Do not redistribute raw API payloads. Attribute NewsAPI in About/Settings if required by your plan.
- Respect publisher copyright; `articles.description` is stored for summarization only, not shown as the main card body.

## Product behavior

- **Cold start:** trending feed; optional 0–3 topic chips on first login.
- **After 20 swipes:** personalized ranking from topic/source weights.
- **Summaries:** generated once per article in `summarizeBatch`, cached in Postgres for all users.

## Scheduled ingestion

Use Supabase Dashboard cron, GitHub Actions, or `pg_cron` to call `ingestNews` and `summarizeBatch` every 15–30 minutes with the service role key or `CRON_SECRET` header.
