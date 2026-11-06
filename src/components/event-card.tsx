import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { countdownLabel, dateBadge, daysUntilEvent, type FitnessEvent } from '@/lib/logic/events';
import { useSavedEvents } from '@/lib/storage/saved-events-store';

type EventCardProps = {
  event: FitnessEvent;
  now: number;
  /** Kurzform ohne Beschreibung, z.B. auf dem Start-Bildschirm */
  compact?: boolean;
};

/** Event mit Kalenderblatt, Countdown und Link zur Veranstalterseite. */
export function EventCard({ event, now, compact = false }: EventCardProps) {
  const theme = useTheme();
  const saved = useSavedEvents((state) => Boolean(state.saved[event.id]));
  const toggle = useSavedEvents((state) => state.toggle);
  const badge = dateBadge(event);
  const soon = daysUntilEvent(event, now) <= 7;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {/* Link und Lesezeichen sind getrennte Flächen, damit Merken nicht die Veranstalterseite öffnet */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${event.name}, ${countdownLabel(event, now)}. Seite des Veranstalters öffnen`}
          onPress={() => void Linking.openURL(event.url)}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
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
            <View style={styles.titleRow}>
              <AppText variant="heading" style={styles.flexTitle}>
                {event.name}
              </AppText>
              <Ionicons name="open-outline" size={14} color={theme.textSecondary} />
            </View>
            <AppText variant="caption" color="textSecondary">
              {event.city}
              {event.distances.length > 0 ? ` · ${event.distances.join(', ')}` : ''}
            </AppText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            saved ? `${event.name} nicht mehr merken` : `${event.name} merken, ich trainiere darauf hin`
          }
          accessibilityState={{ selected: saved }}
          hitSlop={10}
          onPress={() => {
            tapFeedback();
            toggle(event.id);
          }}
          style={[styles.save, { backgroundColor: saved ? theme.accent : theme.surfaceAlt }]}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={saved ? theme.onAccent : theme.textSecondary}
          />
        </Pressable>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  flexTitle: { flexShrink: 1 },
  link: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  pressed: { opacity: 0.7 },
  save: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
