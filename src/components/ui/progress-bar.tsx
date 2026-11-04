import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, type ThemeColor } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  /** Fortschritt von 0 bis 1 */
  progress: number;
  height?: number;
  color?: ThemeColor;
  trackColor?: ThemeColor | string;
  /** Kleinster sichtbarer Anteil, damit auch wenig Fortschritt erkennbar ist */
  minVisible?: number;
  style?: StyleProp<ViewStyle>;
};

/** Waagerechter Fortschrittsbalken, der sich beim Erscheinen animiert füllt. */
export function ProgressBar({ progress, height = 10, color = 'accent', trackColor = 'accentSoft', minVisible = 0.03, style }: ProgressBarProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const clamped = Math.max(0, Math.min(1, progress));
  const target = clamped > 0 ? Math.max(minVisible, clamped) : 0;

  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) {
      value.setValue(target);
      return;
    }
    const animation = Animated.timing(value, { toValue: target, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [target, reduceMotion, value]);

  const track = trackColor in theme ? theme[trackColor as ThemeColor] : trackColor;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, backgroundColor: track }, style]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: theme[color], width: value.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
