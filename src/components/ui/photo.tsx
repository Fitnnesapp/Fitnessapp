import { useId, type ReactNode } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type PhotoProps = {
  source: ImageSourcePropType | null;
  /** Wird gezeigt, solange es kein Foto gibt */
  fallback: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Dunkler Verlauf nach unten, damit Text auf dem Foto lesbar bleibt (0 bis 1) */
  scrim?: number;
  accessibilityLabel?: string;
};

/** Foto mit optionalem Lese-Verlauf; ohne Foto erscheint die Ersatzgrafik. */
export function Photo({ source, fallback, style, scrim = 0, accessibilityLabel }: PhotoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  if (!source) return <>{fallback}</>;

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
      />
      {scrim > 0 ? (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
          <Defs>
            <LinearGradient id={`scrim${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity={scrim * 0.15} />
              <Stop offset="0.45" stopColor="#000000" stopOpacity={scrim * 0.35} />
              <Stop offset="1" stopColor="#000000" stopOpacity={scrim * 0.85} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#scrim${uid})`} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
