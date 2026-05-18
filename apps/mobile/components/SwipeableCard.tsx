import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type SwipeableCardRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
};

type Props = {
  children: React.ReactNode;
  cardWidth: number;
  onSwipedLeft: () => void;
  onSwipedRight: () => void;
};

const SWIPE_OUT_MS = 200;

export const SwipeableCard = forwardRef<SwipeableCardRef, Props>(
  function SwipeableCard(
    { children, cardWidth, onSwipedLeft, onSwipedRight },
    ref,
  ) {
    const translateX = useSharedValue(0);
    const isAnimating = useSharedValue(false);
    const safeWidth = Math.max(cardWidth, 1);
    const threshold = safeWidth * 0.28;

    const finishLeft = useCallback(() => {
      onSwipedLeft();
    }, [onSwipedLeft]);

    const finishRight = useCallback(() => {
      onSwipedRight();
    }, [onSwipedRight]);

    const flyOut = useCallback(
      (direction: 'left' | 'right') => {
        'worklet';
        if (isAnimating.value) return;
        isAnimating.value = true;
        const target =
          direction === 'left' ? -safeWidth * 1.3 : safeWidth * 1.3;
        const done = direction === 'left' ? finishLeft : finishRight;

        translateX.value = withTiming(
          target,
          { duration: SWIPE_OUT_MS },
          (finished) => {
            if (finished) {
              runOnJS(done)();
            }
            isAnimating.value = false;
          },
        );
      },
      [safeWidth, finishLeft, finishRight, isAnimating, translateX],
    );

    useImperativeHandle(
      ref,
      () => ({
        swipeLeft: () => runOnUI(flyOut)('left'),
        swipeRight: () => runOnUI(flyOut)('right'),
      }),
      [flyOut],
    );

    const pan = Gesture.Pan()
      .enabled(cardWidth > 0)
      .activeOffsetX([-15, 15])
      .failOffsetY([-24, 24])
      .onUpdate((e) => {
        if (isAnimating.value) return;
        translateX.value = e.translationX;
      })
      .onEnd((e) => {
        if (isAnimating.value) return;
        if (e.translationX > threshold) {
          flyOut('right');
        } else if (e.translationX < -threshold) {
          flyOut('left');
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
      });

    const cardStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { rotate: `${(translateX.value / safeWidth) * 8}deg` },
      ],
    }));

    const nopeStyle = useAnimatedStyle(() => ({
      opacity:
        translateX.value < -40
          ? Math.min(1, Math.abs(translateX.value) / threshold)
          : 0,
    }));

    const likeStyle = useAnimatedStyle(() => ({
      opacity:
        translateX.value > 40
          ? Math.min(1, translateX.value / threshold)
          : 0,
    }));

    if (cardWidth <= 0) {
      return <View style={styles.wrap}>{children}</View>;
    }

    return (
      <View style={[styles.wrap, { width: cardWidth }]}>
        <Animated.View style={[styles.labelWrap, styles.labelLeft, nopeStyle]}>
          <Text style={styles.labelNope}>NOPE</Text>
        </Animated.View>
        <Animated.View style={[styles.labelWrap, styles.labelRight, likeStyle]}>
          <Text style={styles.labelLike}>LIKE</Text>
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.card, cardStyle]}>{children}</Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
  },
  labelWrap: {
    position: 'absolute',
    zIndex: 10,
    top: 24,
    padding: 8,
    borderWidth: 3,
    borderRadius: 8,
  },
  labelLeft: {
    left: 24,
    borderColor: '#dc2626',
  },
  labelRight: {
    right: 24,
    borderColor: '#16a34a',
  },
  labelNope: {
    color: '#dc2626',
    fontSize: 24,
    fontWeight: '800',
  },
  labelLike: {
    color: '#16a34a',
    fontSize: 24,
    fontWeight: '800',
  },
});
