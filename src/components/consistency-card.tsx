import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { buildHeatmap, type HeatCell } from '@/lib/logic/heatmap';

const WEEKS = 18;
const GAP = 3;
const LABEL_WIDTH = 20;
const ROW_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So'];
const LEVEL_OPACITY = [0, 0.3, 0.55, 0.8, 1];
const SHORT_DATE = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });

/**
 * Beständigkeit als Raster der letzten 18 Wochen. Zählt aktive Wochen statt lückenloser Tage,
 * damit ein Ruhetag nie wie ein Scheitern aussieht.
 */
export function ConsistencyCard() {
  const theme = useTheme();
  const now = useNow(60_000);
  const activities = useActivities();
  const map = useMemo(() => buildHeatmap(activities, now, WEEKS), [activities, now]);
  const [width, setWidth] = useState(0);

  const cell = width > 0 ? Math.max(8, Math.floor((width - LABEL_WIDTH - GAP * WEEKS) / WEEKS)) : 0;
  const color = (day: HeatCell) => (day.level === 0 ? theme.surfaceAlt : theme.accent);

  const headline =
    map.currentWeekRun >= 2
      ? `${map.currentWeekRun} Wochen am Stück aktiv`
      : map.activeWeeks > 0
        ? `${map.activeWeeks} von ${WEEKS} Wochen aktiv`
        : 'Dein Raster wartet';

  return (
    <Card>
      <AppText variant="eyebrow" color="textSecondary">
        Beständigkeit · {WEEKS} Wochen
      </AppText>
      <AppText variant="heading">{headline}</AppText>
      <AppText variant="caption" color="textSecondary">
        {map.activeDays > 0
          ? `${map.activeDays} Trainingstage${map.bestWeekRun > 1 ? ` · beste Serie ${map.bestWeekRun} Wochen` : ''}. Jede Woche mit Training zählt, Ruhetage gehören dazu.`
          : 'Jedes Training färbt einen Tag. Schon eine Einheit pro Woche hält die Serie am Leben.'}
      </AppText>

      <View
        style={styles.grid}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Trainingsraster: ${map.activeDays} Trainingstage in ${map.activeWeeks} von ${WEEKS} Wochen`}>
        {cell > 0 ? (
          <>
            <View style={[styles.labels, { gap: GAP }]}>
              {ROW_LABELS.map((label, index) => (
                <AppText key={index} variant="caption" color="textSecondary" style={[styles.rowLabel, { height: cell, lineHeight: cell }]}>
                  {label}
                </AppText>
              ))}
            </View>
            {map.weeks.map((week) => (
              <View key={week.start} style={{ gap: GAP }}>
                {week.days.map((day) => (
                  <View
                    key={day.key}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: Math.max(2, cell / 4),
                      backgroundColor: color(day),
                      opacity: day.future ? 0.35 : day.level === 0 ? 1 : LEVEL_OPACITY[day.level],
                    }}
                  />
                ))}
              </View>
            ))}
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <AppText variant="caption" color="textSecondary">
          seit {SHORT_DATE.format(map.weeks[0]?.start ?? now)}
        </AppText>
        <View style={styles.legend}>
          <AppText variant="caption" color="textSecondary">
            weniger
          </AppText>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[
                styles.legendCell,
                { backgroundColor: level === 0 ? theme.surfaceAlt : theme.accent, opacity: level === 0 ? 1 : LEVEL_OPACITY[level] },
              ]}
            />
          ))}
          <AppText variant="caption" color="textSecondary">
            mehr
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: GAP, marginTop: Spacing.two, minHeight: 60 },
  labels: { width: LABEL_WIDTH - GAP },
  rowLabel: { fontSize: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.one },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendCell: { width: 10, height: 10, borderRadius: 3 },
});
