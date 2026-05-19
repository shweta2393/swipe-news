import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_BAR_AREA = 56;
const SWIPE_CONTROLS_HEIGHT = 100;
const TAB_BAR_HEIGHT = 56;

/** Max width for feed column on desktop web (phone-like card). */
export const MAX_FEED_CONTENT_WIDTH = 440;

export function useIsDesktopWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 600;
}

/** Height for feed cards; constrains width on desktop web. */
export function useFeedCardLayout() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktopWeb = Platform.OS === 'web' && width >= 600;

  const columnWidth = isDesktopWeb
    ? Math.min(MAX_FEED_CONTENT_WIDTH, width)
    : width;
  const horizontalInset = isDesktopWeb
    ? Math.max(0, (width - columnWidth) / 2)
    : 16;
  const cardWidth = columnWidth - 32;

  const reservedTop = insets.top + STATUS_BAR_AREA;
  // Extra buffer on Android for gesture nav / edge-to-edge (API 35+)
  const androidBottomBuffer = Platform.OS === 'android' ? 12 : 0;
  const reservedBottom =
    insets.bottom +
    SWIPE_CONTROLS_HEIGHT +
    TAB_BAR_HEIGHT +
    16 +
    androidBottomBuffer;
  const cardHeight = Math.min(
    Math.max(height - reservedTop - reservedBottom, 320),
    520,
  );

  return {
    cardHeight,
    cardWidth,
    horizontalInset,
    columnWidth,
    isDesktopWeb,
  };
}
