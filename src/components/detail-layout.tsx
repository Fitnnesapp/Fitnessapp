import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { formatDate, formatTime } from '@/lib/logic/format';

/** Gemeinsamer Kopf aller Workout-Details: Datum, Titel, optionale Zusatzzeile. */
export function DetailHeader({ startedAt, title, subtitle }: { startedAt: number; title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <AppText variant="label" color="textSecondary">
        {formatDate(startedAt).toUpperCase()} · {formatTime(startedAt)}
      </AppText>
      <AppText variant="title">{title}</AppText>
      {subtitle ? <AppText color="textSecondary">{subtitle}</AppText> : null}
    </View>
  );
}

export type StatItem = { label: string; value: string; unit?: string };

/** Gemeinsames Raster für Kennzahlen, damit alle Trainingsarten gleich aussehen. */
export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card key={item.label} style={styles.stat}>
          <AppText variant="label" color="textSecondary">
            {item.label.toUpperCase()}
          </AppText>
          <AppText variant="heading">{item.value}</AppText>
          {item.unit ? (
            <AppText variant="caption" color="textSecondary">
              {item.unit}
            </AppText>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { flexGrow: 1, flexBasis: '45%', padding: Spacing.three, gap: Spacing.one },
});
