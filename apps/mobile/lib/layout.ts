import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_BAR_AREA = 56;
const SWIPE_CONTROLS_HEIGHT = 100;
const TAB_BAR_HEIGHT = 56;

/** Height for feed cards so they fit above swipe buttons without empty space. */
export function useFeedCardLayout() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const reservedTop = insets.top + STATUS_BAR_AREA;
  const reservedBottom = insets.bottom + SWIPE_CONTROLS_HEIGHT + TAB_BAR_HEIGHT + 16;
  const cardHeight = Math.min(height - reservedTop - reservedBottom, 520);
  const horizontalInset = 16;
  const cardWidth = width - horizontalInset * 2;

  return { cardHeight, cardWidth, horizontalInset };
}
