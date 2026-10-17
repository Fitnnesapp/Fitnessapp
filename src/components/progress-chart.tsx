import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

export type ChartPoint = { at: number; value: number };

type ProgressChartProps = {
  points: ChartPoint[];
  unitLabel: string;
  height?: number;
};

const PAD = { top: 16, bottom: 28, left: 8, right: 8 };

const formatDay = (at: number) => {
  const d = new Date(at);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
};

const formatValue = (value: number) => String(Math.round(value * 10) / 10).replace('.', ',');

/** Einfaches Liniendiagramm ohne weitere Abhängigkeiten, gezeichnet mit react-native-svg. */
export function ProgressChart({ points, unitLabel, height = 180 }: ProgressChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  if (points.length === 0) {
    return (
      <AppText color="textSecondary">
        Noch keine Daten. Nach deinem ersten Workout mit dieser Übung erscheint hier der Verlauf.
      </AppText>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - ((value - min) / span) * innerH;

  const coords = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.wrapper}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={height - PAD.bottom}
            y2={height - PAD.bottom}
            stroke={theme.border}
            strokeWidth={1}
          />
          {points.length > 1 ? (
            <Polyline points={coords} fill="none" stroke={theme.accent} strokeWidth={3} strokeLinejoin="round" />
          ) : null}
          {points.map((p, i) => (
            <Circle key={`${p.at}-${i}`} cx={x(i)} cy={y(p.value)} r={5} fill={theme.accent} />
          ))}
          <SvgText
            x={x(points.length - 1)}
            y={y(last.value) - 10}
            fill={theme.text}
            fontSize={12}
            fontWeight="700"
            textAnchor="end">
            {`${formatValue(last.value)} ${unitLabel}`}
          </SvgText>
          <SvgText x={PAD.left} y={height - 8} fill={theme.textSecondary} fontSize={11}>
            {formatDay(first.at)}
          </SvgText>
          <SvgText x={width - PAD.right} y={height - 8} fill={theme.textSecondary} fontSize={11} textAnchor="end">
            {formatDay(last.at)}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
});
