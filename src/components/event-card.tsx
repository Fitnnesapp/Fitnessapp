import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { countdownLabel, dateBadge, daysUntilEvent, type FitnessEvent } from '@/lib/logic/events';

type EventCardProps = {
  event: FitnessEvent;
  now: number;
  /** Kurzform ohne Beschreibung, z.B. auf dem Start-Bildschirm */
  compact?: boolean;
};

/** Event mit Kalenderblatt, Countdown und Link zur Veranstalterseite. */
export function EventCard({ event, now, compact = false }: EventCardProps) {
  const theme = useTheme();
  const badge = dateBadge(event);
  const soon = daysUntilEvent(event, now) <= 7;

  return (
    <Card onPress={() => void Linking.openURL(event.url)} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.calendar, { backgroundColor: soon ? theme.accent : theme.surfaceAlt }]}>
          <AppText variant="caption" style={{ color: soon ? theme.onAccent : theme.textSecondary }}>
            {badge.month.toUpperCase()}
          </AppText>
          <AppText variant="title" style={[styles.day, { color: soon ? theme.onAccent : theme.text }]}>
            {badge.day}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" color={soon ? 'accent' : 'textSecondary'}>
            {countdownLabel(event, now).toUpperCase()} · {event.kind === 'lauf' ? 'LAUF' : 'FITNESS'}
          </AppText>
          <AppText variant="heading">{event.name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {event.city}
            {event.distances.length > 0 ? ` · ${event.distances.join(', ')}` : ''}
          </AppText>
        </View>
        <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
      </View>
      {compact || !event.description ? null : (
        <AppText variant="caption" color="textSecondary">
          {event.description}
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  calendar: { width: 56, paddingVertical: Spacing.two, borderRadius: Radius.medium, alignItems: 'center' },
  day: { lineHeight: 30 },
});
