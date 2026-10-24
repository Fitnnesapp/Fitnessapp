import { useId, type ReactNode } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Radius, Spacing } from '@/constants/theme';

type ImageCardProps = {
  source: ImageSourcePropType;
  height: number;
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Stärke des dunklen Verlaufs nach unten, damit weißer Text lesbar bleibt (0 bis 1) */
  scrim?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Vollflächige Bildkarte im Stil großer Trainings-Apps: Bild über die ganze Karte,
 * Inhalt unten auf einem dunklen Verlauf. Text darauf immer hell (Bilder sind dunkel abgestimmt).
 */
export function ImageCard({ source, height, children, onPress, accessibilityLabel, scrim = 1, style }: ImageCardProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = (
    <ImageBackground source={source} resizeMode="cover" style={[styles.image, { height }]} imageStyle={styles.radius}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id={`s${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={0.05 * scrim} />
            <Stop offset="0.5" stopColor="#000000" stopOpacity={0.25 * scrim} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.82 * scrim} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#s${uid})`} />
      </Svg>
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );

  if (!onPress) return <View style={[styles.wrap, style]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, style, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.large, overflow: 'hidden' },
  radius: { borderRadius: Radius.large },
  image: { justifyContent: 'flex-end' },
  content: { padding: Spacing.four, gap: Spacing.two },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
