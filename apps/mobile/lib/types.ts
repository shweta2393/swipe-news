export interface FeedArticle {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  display_summary: string;
  source_name: string;
  source_domain: string | null;
  image_url: string | null;
  published_at: string | null;
  topics: string[];
  favicon_url: string | null;
}

export interface FeedResponse {
  articles: FeedArticle[];
  swipe_count: number;
  personalization_enabled: boolean;
  just_personalized?: boolean;
}

export interface SwipeResponse {
  ok: boolean;
  swipe_count: number;
  personalization_enabled: boolean;
  just_personalized?: boolean;
}

export interface SavedArticleItem {
  article_id: string;
  created_at: string;
  articles: {
    id: string;
    title: string;
    url: string;
    source_name: string;
    source_domain: string | null;
    image_url: string | null;
    summary: string | null;
    published_at: string | null;
  } | null;
}

export interface ArticleActionResult {
  ok: boolean;
  saved?: boolean;
  already_saved?: boolean;
  swipe_count?: number;
  personalization_enabled?: boolean;
  just_personalized?: boolean;
}

export const ONBOARDING_TOPICS = [
  { id: 'technology', label: 'Tech' },
  { id: 'business', label: 'Business' },
  { id: 'sports', label: 'Sports' },
  { id: 'science', label: 'Science' },
  { id: 'health', label: 'Health' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'politics', label: 'Politics' },
  { id: 'world', label: 'World' },
] as const;
