import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { BACK, BODY_HALF, FRONT, HEAD, MAP_HEIGHT, MAP_WIDTH, type MuscleShape } from '@/data/muscle-map';
import { useTheme } from '@/hooks/use-theme';
import type { MuscleLoad } from '@/lib/logic/muscle-load';
import { mirrorPath } from '@/lib/logic/svg-mirror';
import type { MuscleGroup } from '@/types/workout';

type MuscleMapProps = {
  /** Belastung je Muskelgruppe von 0 bis 1 */
  load: MuscleLoad;
  /** Höhe einer Körperansicht in Punkten */
  height?: number;
  /** Beschriftung "Vorne"/"Hinten" und Legende anzeigen */
  showLegend?: boolean;
  /** Text für kräftige und blasse Färbung */
  legendLabels?: [strong: string, light: string];
};

const BODY_RIGHT = mirrorPath(BODY_HALF, MAP_WIDTH);
const withMirror = (shapes: readonly MuscleShape[]) =>
  shapes.flatMap((shape, index) => [
    { key: `${index}l`, muscle: shape.muscle, d: shape.d },
    { key: `${index}r`, muscle: shape.muscle, d: mirrorPath(shape.d, MAP_WIDTH) },
  ]);
const FRONT_PATHS = withMirror(FRONT);
const BACK_PATHS = withMirror(BACK);

/** Körperkarte vorne und hinten: belastete Muskelgruppen leuchten im Akzent, je stärker desto kräftiger. */
export function MuscleMap({
  load,
  height = 200,
  showLegend = true,
  legendLabels = ['Hauptarbeit', 'unterstützt'],
}: MuscleMapProps) {
  const theme = useTheme();
  const width = (height * MAP_WIDTH) / MAP_HEIGHT;
  const trained = useMemo(
    () =>
      (Object.entries(load) as [MuscleGroup, number][])
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([muscle]) => muscle),
    [load],
  );

  const label = trained.length > 0 ? `Körperkarte, trainiert: ${trained.join(', ')}` : 'Körperkarte ohne Belastung';

  const view = (paths: typeof FRONT_PATHS, caption: string) => (
    <View style={styles.view}>
      <Svg width={width} height={height} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
        <Path d={HEAD} fill={theme.surfaceAlt} />
        <Path d={BODY_HALF} fill={theme.surfaceAlt} />
        <Path d={BODY_RIGHT} fill={theme.surfaceAlt} />
        {paths.map((path) => {
          const value = load[path.muscle] ?? 0;
          return (
            <Path
              key={path.key}
              d={path.d}
              fill={value > 0 ? theme.accent : theme.border}
              fillOpacity={value > 0 ? 0.3 + 0.7 * value : 1}
            />
          );
        })}
      </Svg>
      {showLegend ? (
        <AppText variant="eyebrow" color="textSecondary">
          {caption}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.wrap}>
      <View style={styles.row}>
        {view(FRONT_PATHS, 'Vorne')}
        {view(BACK_PATHS, 'Hinten')}
      </View>
      {showLegend ? (
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <AppText variant="caption" color="textSecondary">
            {legendLabels[0]}
          </AppText>
          <View style={[styles.dot, { backgroundColor: theme.accent, opacity: 0.45 }]} />
          <AppText variant="caption" color="textSecondary">
            {legendLabels[1]}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.five },
  view: { alignItems: 'center', gap: Spacing.one },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
