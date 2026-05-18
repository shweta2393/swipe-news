-- Summary status for articles
CREATE TYPE summary_status AS ENUM ('pending', 'done', 'failed');

CREATE TYPE swipe_direction AS ENUM ('left', 'right');

-- Global article cache (shared by all users)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  source_name TEXT NOT NULL,
  source_domain TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  topics TEXT[] DEFAULT '{}',
  summary_status summary_status NOT NULL DEFAULT 'pending',
  summary_prompt_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX articles_published_at_idx ON articles (published_at DESC);
CREATE INDEX articles_summary_status_idx ON articles (summary_status);
CREATE INDEX articles_topics_gin_idx ON articles USING GIN (topics);

-- User profile (extends auth.users)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  onboarding_topics TEXT[],
  swipe_count INT NOT NULL DEFAULT 0,
  personalization_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Preference weights from swipes
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  topic_weights JSONB NOT NULL DEFAULT '{}',
  source_weights JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Swipe history
CREATE TABLE user_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  direction swipe_direction NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX user_swipes_user_id_idx ON user_swipes (user_id);

-- Saved articles
CREATE TABLE saved_articles (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

-- Auto-create profile + preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

-- Articles: readable by authenticated users
CREATE POLICY "articles_select_authenticated"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

-- Service role inserts via edge functions (bypasses RLS with service key)

CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_select_own"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_swipes_select_own"
  ON user_swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_swipes_insert_own"
  ON user_swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_swipes_update_own"
  ON user_swipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_articles_select_own"
  ON saved_articles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "saved_articles_insert_own"
  ON saved_articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_articles_delete_own"
  ON saved_articles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
