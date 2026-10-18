import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { downsample, splitSegments } from '@/lib/logic/run-stats';
import type { TrackPoint } from '@/types/running';

type RouteMapProps = {
  points: TrackPoint[];
  height?: number;
};

const PAD = 20;
const MAX_DRAWN_POINTS = 800;

/**
 * Zeichnet die Laufstrecke als Linie. Bewusst ohne Kartenhintergrund: Kacheln bräuchten Internet,
 * die App soll aber komplett offline funktionieren.
 */
export function RouteMap({ points, height = 260 }: RouteMapProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  if (points.length < 2) {
    return (
      <AppText color="textSecondary">Für diese Strecke wurden zu wenige GPS-Punkte aufgezeichnet.</AppText>
    );
  }

  const drawn = downsample(points, MAX_DRAWN_POINTS);
  const lats = drawn.map((p) => p.lat);
  const lngs = drawn.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Längengrade werden zu den Polen hin enger, daher mit dem Kosinus der Breite stauchen
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = Math.max((maxLng - minLng) * lngScale, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);

  const innerW = Math.max(0, width - PAD * 2);
  const innerH = height - PAD * 2;
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const offsetX = PAD + (innerW - spanX * scale) / 2;
  const offsetY = PAD + (innerH - spanY * scale) / 2;

  const project = (p: TrackPoint) => ({
    x: offsetX + (p.lng - minLng) * lngScale * scale,
    y: offsetY + (maxLat - p.lat) * scale,
  });

  const segments = splitSegments(drawn);
  const start = project(drawn[0]);
  const end = project(drawn[drawn.length - 1]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.wrapper, { height, backgroundColor: theme.surfaceAlt }]}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {segments.map((segment, i) => {
            const next = segments[i + 1];
            const from = project(segment[segment.length - 1]);
            const to = next ? project(next[0]) : null;

            return (
              <G key={i}>
                {to ? (
                  <Line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={theme.textSecondary}
                    strokeWidth={2}
                    strokeDasharray="4 6"
                  />
                ) : null}
                <Polyline
                  points={segment.map((p) => `${project(p).x},${project(p).y}`).join(' ')}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth={4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </G>
            );
          })}
          <Circle cx={start.x} cy={start.y} r={7} fill={theme.success} stroke={theme.background} strokeWidth={2} />
          <Circle cx={end.x} cy={end.y} r={7} fill={theme.danger} stroke={theme.background} strokeWidth={2} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', borderRadius: Radius.large, overflow: 'hidden' },
});
