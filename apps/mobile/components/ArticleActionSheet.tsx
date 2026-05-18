import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo, type ComponentProps } from 'react';
import { Pressable, Share, StyleSheet, Text } from 'react-native';

import type { FeedArticle } from '@/lib/types';

type Props = {
  article: FeedArticle | null;
  onSave: () => void;
  onLessLikeThis: () => void;
  onClose: () => void;
};

export const ArticleActionSheet = forwardRef<BottomSheetModal, Props>(
  function ArticleActionSheet(
    { article, onSave, onLessLikeThis, onClose },
    ref,
  ) {
    const snapPoints = useMemo(() => ['38%'], []);

    const renderBackdrop = useCallback(
      (props: ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    );

    const handleShare = async () => {
      if (!article) return;
      await Share.share({
        message: `${article.title}\n${article.url}`,
        url: article.url,
        title: article.title,
      });
      onClose();
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
      >
        <BottomSheetView style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {article?.title}
          </Text>

          <Pressable style={styles.action} onPress={onSave}>
            <Text style={styles.actionText}>Save article</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={handleShare}>
            <Text style={styles.actionText}>Share</Text>
          </Pressable>

          <Pressable style={[styles.action, styles.destructive]} onPress={onLessLikeThis}>
            <Text style={[styles.actionText, styles.destructiveText]}>
              Show less like this
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  action: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 17,
    color: '#111827',
  },
  destructive: {
    borderBottomWidth: 0,
  },
  destructiveText: {
    color: '#dc2626',
  },
});
