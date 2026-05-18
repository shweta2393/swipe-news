import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ArticleActionSheet } from '@/components/ArticleActionSheet';
import { ArticleCard } from '@/components/ArticleCard';
import { SwipeableCard, type SwipeableCardRef } from '@/components/SwipeableCard';
import { SwipeControls } from '@/components/SwipeControls';
import {
  articleAction,
  recordSwipe,
  saveArticleDirect,
} from '@/lib/api';
import type { FeedArticle } from '@/lib/types';
import { useFeed } from '@/hooks/useFeed';
import { useFeedCardLayout } from '@/lib/layout';

export default function FeedScreen() {
  const {
    articles,
    loading,
    error,
    swipeCount,
    personalized,
    load,
    bumpSwipeCount,
    setSwipeCount,
    setPersonalized,
  } = useFeed();

  const [cardIndex, setCardIndex] = useState(0);
  const [actionArticle, setActionArticle] = useState<FeedArticle | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const cardRef = useRef<SwipeableCardRef>(null);
  const countedSwipeIds = useRef(new Set<string>());
  const pendingLessLikeId = useRef<string | null>(null);
  const articlesRef = useRef(articles);
  const cardIndexRef = useRef(cardIndex);
  const initialLoadDone = useRef(false);

  const { cardHeight, cardWidth, horizontalInset, columnWidth, isDesktopWeb } =
    useFeedCardLayout();

  articlesRef.current = articles;
  cardIndexRef.current = cardIndex;

  const refreshFeed = useCallback(async () => {
    countedSwipeIds.current.clear();
    pendingLessLikeId.current = null;
    setCardIndex(0);
    await load();
  }, [load]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      refreshFeed();
    }
  }, [refreshFeed]);

  const recordSwipeForArticle = useCallback(
    async (article: FeedArticle, direction: 'left' | 'right') => {
      try {
        const result = await recordSwipe(article.id, direction);
        setSwipeCount(result.swipe_count);
        setPersonalized(result.personalization_enabled);
        if (result.just_personalized) {
          Alert.alert('Feed personalized', 'Your feed is now tailored to your swipes.');
        }
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Swipe failed');
      }
    },
    [setSwipeCount, setPersonalized],
  );

  const afterSwipe = useCallback((direction: 'left' | 'right') => {
    const index = cardIndexRef.current;
    const list = articlesRef.current;
    const article = list[index];
    if (!article) return;

    bumpSwipeCount(article.id, countedSwipeIds.current);

    const nextIndex = index + 1;
    setCardIndex(nextIndex);

    if (nextIndex >= list.length) {
      setTimeout(() => refreshFeed(), 300);
    }

    const isLessLike =
      direction === 'left' && pendingLessLikeId.current === article.id;
    if (isLessLike) {
      pendingLessLikeId.current = null;
      articleAction('less_like_this', article.id)
        .then((result) => {
          setSwipeCount(result.swipe_count ?? 0);
          setPersonalized(result.personalization_enabled ?? false);
          if (result.just_personalized) {
            Alert.alert(
              'Feed personalized',
              'Your feed is now tailored to your swipes.',
            );
          }
        })
        .catch((e) => {
          Alert.alert('Error', e instanceof Error ? e.message : 'Action failed');
        });
      return;
    }

    recordSwipeForArticle(article, direction);
  }, [bumpSwipeCount, recordSwipeForArticle, refreshFeed, setSwipeCount, setPersonalized]);

  const onSwipedLeft = useCallback(() => afterSwipe('left'), [afterSwipe]);
  const onSwipedRight = useCallback(() => afterSwipe('right'), [afterSwipe]);

  const openArticle = async (article: FeedArticle) => {
    try {
      await WebBrowser.openBrowserAsync(article.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        enableBarCollapsing: true,
      });
    } catch {
      Alert.alert(
        'Cannot open in app',
        'Open this article in your browser?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => Linking.openURL(article.url) },
        ],
      );
    }
  };

  const openActions = (article: FeedArticle) => {
    setActionArticle(article);
    sheetRef.current?.present();
  };

  const handleSave = () => {
    if (!actionArticle) return;
    const articleId = actionArticle.id;
    sheetRef.current?.dismiss();
    setActionArticle(null);

    saveArticleDirect(articleId)
      .then((result) => {
        if (result.already_saved) {
          Alert.alert('Already saved', 'This article is already in your saved list.');
        } else {
          Alert.alert('Saved', 'Article saved. View it in Profile → Saved articles.');
        }
      })
      .catch((e) => {
        Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
      });
  };

  const handleLessLikeThis = () => {
    if (!actionArticle) return;
    pendingLessLikeId.current = actionArticle.id;
    sheetRef.current?.dismiss();
    setActionArticle(null);
    cardRef.current?.swipeLeft();
  };

  if (loading && !articles.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error && !articles.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.retry} onPress={refreshFeed}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!articles.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No articles yet</Text>
        <Text style={styles.emptyBody}>
          Run ingestNews and summarizeBatch on your Supabase project, then pull to refresh.
        </Text>
        <Text style={styles.retry} onPress={refreshFeed}>
          Refresh
        </Text>
      </View>
    );
  }

  const currentArticle = articles[cardIndex];
  const nextArticle = articles[cardIndex + 1];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.contentColumn,
          isDesktopWeb && { maxWidth: columnWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {personalized ? 'Personalized feed' : `Learning… ${swipeCount}/20 swipes`}
        </Text>
        <Text style={styles.swipeHint}>
          {isDesktopWeb ? 'Drag card or use buttons below' : 'Swipe or use buttons below'}
        </Text>
      </View>

      <View
        style={[
          styles.deck,
          {
            height: cardHeight + 16,
            paddingHorizontal: isDesktopWeb ? 16 : horizontalInset,
          },
        ]}
      >
        {nextArticle ? (
          <View style={[styles.behindCard, { height: cardHeight, width: cardWidth }]}>
            <ArticleCard article={nextArticle} onLongPress={() => {}} />
          </View>
        ) : null}

        {currentArticle && cardWidth > 0 ? (
          <SwipeableCard
            key={currentArticle.id}
            ref={cardRef}
            cardWidth={cardWidth}
            onSwipedLeft={onSwipedLeft}
            onSwipedRight={onSwipedRight}
          >
            <ArticleCard
              article={currentArticle}
              style={{ height: cardHeight, width: cardWidth }}
              onLongPress={() => openActions(currentArticle)}
              onMoreOptions={() => openActions(currentArticle)}
              onPress={() => openArticle(currentArticle)}
            />
          </SwipeableCard>
        ) : (
          <View style={styles.centerDeck}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}
      </View>

      <SwipeControls
        onPass={() => cardRef.current?.swipeLeft()}
        onLike={() => cardRef.current?.swipeRight()}
        disabled={!currentArticle}
        maxWidth={isDesktopWeb ? columnWidth : undefined}
      />
      </View>

      <ArticleActionSheet
        ref={sheetRef}
        article={actionArticle}
        onSave={handleSave}
        onLessLikeThis={handleLessLikeThis}
        onClose={() => setActionArticle(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  contentColumn: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f1f5f9',
  },
  statusBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  swipeHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  deck: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  behindCard: {
    position: 'absolute',
    opacity: 0.55,
    transform: [{ scale: 0.96 }],
  },
  centerDeck: {
    height: 200,
    justifyContent: 'center',
  },
  error: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    color: '#3b82f6',
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 22,
  },
});
