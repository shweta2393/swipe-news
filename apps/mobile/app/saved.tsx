import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SavedArticleRow } from '@/components/SavedArticleRow';
import { articleAction, fetchSavedArticles } from '@/lib/api';
import type { SavedArticleItem } from '@/lib/types';

export default function SavedArticlesScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SavedArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchSavedArticles();
      setItems(data.filter((row) => row.articles != null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load saved articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openArticle = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url);
    }
  };

  const handleRemove = async (articleId: string) => {
    try {
      await articleAction('unsave', articleId);
      setItems((prev) => prev.filter((i) => i.article_id !== articleId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove article');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <FontAwesome name="chevron-left" size={18} color="#3b82f6" />
            <Text style={styles.backText}>Profile</Text>
          </Pressable>
          <Text style={styles.title}>Saved articles</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#3b82f6" />
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={load}>
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <FontAwesome name="bookmark-o" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No saved articles</Text>
            <Text style={styles.emptyBody}>
              Long-press a card in the feed and tap Save to bookmark articles here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.article_id}
            renderItem={({ item }) => (
              <SavedArticleRow
                item={item}
                onOpen={openArticle}
                onRemove={handleRemove}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 22,
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  retry: {
    color: '#3b82f6',
    fontSize: 16,
  },
});
