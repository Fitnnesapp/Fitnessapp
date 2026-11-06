import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useBenefitEntries } from '@/hooks/use-weekly-benefit';
import { weekStart } from '@/lib/logic/activity';
import { benefitHistory, WHO_AEROBIC_MINUTES } from '@/lib/logic/health-benefit';

const CHART_HEIGHT = 96;
/** Oberkante der Skala: doppelte Empfehlung, darüber wird abgeschnitten */
const SCALE_MAX = WHO_AEROBIC_MINUTES * 2;

/**
 * 12 Wochen Gesundheits-Nutzen als Balken: Ausdauerminuten gegen die WHO-Linie,
 * Punkte für erfüllte Krafttage. Zeigt Beständigkeit statt einzelner Spitzen.
 */
export function HealthWeeksCard() {
  const theme = useTheme();
  const now = useNow(60_000);
  const entries = useBenefitEntries();
  const weeks = useMemo(() => benefitHistory(entries, weekStart(now)), [entries, now]);
  // Nur Wochen seit dem ersten Training zählen, sonst wirkt "1 von 11" für neue Nutzer entmutigend
  const first = entries.reduce((min, e) => Math.min(min, e.startedAt), Infinity);
  const fullWeeks = weeks.slice(0, -1).filter((w) => w.weekStart + 7 * 86_400_000 > first);
  const met = fullWeeks.filter((w) => w.aerobicMet && w.strengthMet).length;
  const linePosition = (WHO_AEROBIC_MINUTES / SCALE_MAX) * CHART_HEIGHT;

  return (
    <Card>
      <AppText variant="label" color="textSecondary">
        GESUNDHEITS-NUTZEN · 12 WOCHEN
      </AppText>
      <AppText variant="heading">
        {met === 0
          ? 'Jede Woche zählt. Die Linie zeigt die WHO-Empfehlung.'
          : `In ${met} von ${fullWeeks.length} ${fullWeeks.length === 1 ? 'Woche' : 'Wochen'} beide Empfehlungen erfüllt`}
      </AppText>

      <View
        style={[styles.chart, { height: CHART_HEIGHT }]}
        accessible
        accessibilityLabel={`Ausdauerminuten der letzten 12 Wochen: ${weeks.map((w) => w.aerobicMinutes).join(', ')}`}>
        <View style={[styles.line, { bottom: linePosition, borderColor: theme.textSecondary }]} />
        {weeks.map((week, index) => {
          const current = index === weeks.length - 1;
          const height = Math.max(3, (Math.min(week.aerobicMinutes, SCALE_MAX) / SCALE_MAX) * CHART_HEIGHT);
          return (
            <View key={week.weekStart} style={styles.column}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: week.aerobicMet ? theme.accent : theme.accentSoft,
                    opacity: current ? 0.6 : 1,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.dots}>
        {weeks.map((week) => (
          <View key={week.weekStart} style={styles.column}>
            <View
              style={[
                styles.dot,
                { backgroundColor: week.strengthMet ? theme.accent : week.strengthDays > 0 ? theme.accentSoft : theme.surfaceAlt },
              ]}
            />
          </View>
        ))}
      </View>

      <AppText variant="caption" color="textSecondary">
        Balken: Ausdauerminuten pro Woche (Laufminuten zählen doppelt), gestrichelt die 150 Minuten. Punkte: 2 Krafttage
        erreicht. Die aktuelle Woche ist heller.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.one, position: 'relative' },
  line: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  column: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', borderTopLeftRadius: Radius.small, borderTopRightRadius: Radius.small },
  dots: { flexDirection: 'row', gap: Spacing.one },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
