import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProgressRingProps = {
  /** Fortschritt von 0 bis 1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: ThemeColor;
  trackColor?: ThemeColor;
  /** Inhalt in der Mitte des Rings */
  children?: ReactNode;
};

/** Kreisförmige Fortschrittsanzeige, beginnt oben und läuft im Uhrzeigersinn. */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  color = 'accent',
  trackColor = 'accentSoft',
  children,
}: ProgressRingProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const center = size / 2;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={theme[trackColor]} strokeWidth={strokeWidth} fill="none" />
        {clamped > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme[color]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - clamped)}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
