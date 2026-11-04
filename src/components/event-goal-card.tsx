import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysUntilEvent, eventFocus, type FitnessEvent } from '@/lib/logic/events';

/** Gemerktes Event als Ziel: großer Countdown, aktuelle Vorbereitungsphase und ein konkreter Tipp. */
export function EventGoalCard({ event, now }: { event: FitnessEvent; now: number }) {
  const router = useRouter();
  const theme = useTheme();
  const days = daysUntilEvent(event, now);
  const focus = eventFocus(event, now);

  return (
    <Card
      onPress={() => router.push(event.kind === 'lauf' ? '/training/running' : '/training')}
      style={[styles.card, { borderColor: theme.accent }]}
      accessibilityLabel={`Dein Event ${event.name}: noch ${days} Tage. ${focus.phase}. ${focus.tip}`}>
      <View style={styles.row}>
        <View style={[styles.count, { backgroundColor: theme.accent }]}>
          <AppText variant="number" style={[styles.countValue, { color: theme.onAccent }]}>
            {days}
          </AppText>
          <AppText variant="eyebrow" style={{ color: theme.onAccent }}>
            {days === 1 ? 'Tag' : 'Tage'}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="eyebrow" color="accent">
            Dein Event · {focus.phase}
          </AppText>
          <AppText variant="heading">{event.name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {event.city}
            {event.distances.length > 0 ? ` · ${event.distances.join(', ')}` : ''}
          </AppText>
        </View>
      </View>
      <View style={[styles.tip, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name="flag" size={16} color={theme.accent} />
        <AppText variant="caption" style={styles.flex}>
          {focus.tip}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  count: { width: 72, height: 72, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  countValue: { fontSize: 30, lineHeight: 34 },
  flex: { flex: 1, gap: 2 },
  tip: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'flex-start',
  },
});
