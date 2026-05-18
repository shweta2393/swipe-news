import FontAwesome from '@expo/vector-icons/FontAwesome';
import { formatDistanceToNow } from 'date-fns';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { SourceAttribution } from '@/components/SourceAttribution';
import type { FeedArticle } from '@/lib/types';

type Props = {
  article: FeedArticle;
  onLongPress: () => void;
  onMoreOptions?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function getSummaryText(article: FeedArticle): string {
  const summary = article.display_summary?.trim();
  const title = article.title?.trim() ?? '';

  if (summary && summary !== title && summary !== 'Summary loading…') {
    return summary;
  }
  if (article.summary?.trim() && article.summary !== title) {
    return article.summary;
  }
  return '';
}

export function ArticleCard({
  article,
  onPress,
  onLongPress,
  onMoreOptions,
  style,
}: Props) {
  const isWeb = Platform.OS === 'web';
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : '';

  const summaryText = getSummaryText(article);
  const imageUri = article.image_url?.trim() || null;

  return (
    <View style={[styles.card, style]}>
      <Pressable onPress={onPress} disabled={!onPress}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>Swipe News</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            {article.favicon_url ? (
              <Image source={{ uri: article.favicon_url }} style={styles.favicon} />
            ) : (
              <View style={[styles.favicon, styles.faviconPlaceholder]} />
            )}
            <Text style={styles.time}>{timeAgo}</Text>
          </View>

          {isWeb && onMoreOptions ? (
            <Pressable
              style={styles.moreButton}
              onPress={onMoreOptions}
              accessibilityLabel="More options"
            >
              <FontAwesome name="ellipsis-h" size={16} color="#64748b" />
              <Text style={styles.moreLabel}>More</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={onPress} disabled={!onPress}>
          <Text style={styles.title} numberOfLines={3}>
            {article.title}
          </Text>

          {summaryText ? (
            <Text style={styles.summary} numberOfLines={4}>
              {summaryText}
            </Text>
          ) : null}
        </Pressable>

        <SourceAttribution sourceName={article.source_name} />

        {isWeb ? (
          <Text style={styles.hint}>Click headline to read full article</Text>
        ) : (
          <Pressable
            onLongPress={onLongPress}
            delayLongPress={400}
            style={styles.hintPressable}
          >
            <Text style={styles.hint}>
              Tap headline to read · Long press here for options
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  heroImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e5e7eb',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  heroPlaceholderText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    padding: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginLeft: 8,
  },
  moreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 4,
  },
  favicon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  faviconPlaceholder: {
    backgroundColor: '#e5e7eb',
  },
  time: {
    fontSize: 13,
    color: '#9ca3af',
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 10,
  },
  hintPressable: {
    marginTop: 10,
    paddingVertical: 4,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
