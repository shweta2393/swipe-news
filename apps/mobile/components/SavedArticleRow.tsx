import FontAwesome from '@expo/vector-icons/FontAwesome';
import { formatDistanceToNow } from 'date-fns';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { SavedArticleItem } from '@/lib/types';

type Props = {
  item: SavedArticleItem;
  onOpen: (url: string) => void;
  onRemove: (articleId: string) => void;
};

export function SavedArticleRow({ item, onOpen, onRemove }: Props) {
  const article = item.articles;
  if (!article) return null;

  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : '';

  const confirmRemove = () => {
    Alert.alert(
      'Remove saved article',
      'Remove this article from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(item.article_id),
        },
      ],
    );
  };

  return (
    <Pressable style={styles.row} onPress={() => onOpen(article.url)}>
      {article.image_url ? (
        <Image source={{ uri: article.image_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={styles.meta}>
          Source: {article.source_name}
          {timeAgo ? ` · ${timeAgo}` : ''}
        </Text>
      </View>

      <Pressable
        style={styles.removeBtn}
        onPress={confirmRemove}
        hitSlop={12}
        accessibilityLabel="Remove from saved"
      >
        <FontAwesome name="trash-o" size={20} color="#dc2626" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  thumbPlaceholder: {
    backgroundColor: '#cbd5e1',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 21,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
  },
  removeBtn: {
    padding: 8,
  },
});
