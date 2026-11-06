import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/use-reduce-motion';

type FadeInProps = {
  children: ReactNode;
  /** Verzögerung in ms, für gestaffelte Abschnitte */
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/** Blendet einen Abschnitt beim Erscheinen sanft von unten ein. Bei "Bewegung reduzieren" sofort sichtbar. */
export function FadeIn({ children, delay = 0, style }: FadeInProps) {
  const reduceMotion = useReduceMotion();
  const [value] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(1);
      return;
    }
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [delay, reduceMotion, value]);

  const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
