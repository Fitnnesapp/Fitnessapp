import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { formatClock } from '@/lib/logic/format';
import { activeElapsedAt } from '@/lib/logic/run-stats';
import { formatDistance } from '@/lib/logic/units';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Laufende Einheiten (Krafttraining, Lauf) mit Sprung zurück. Erscheint auf Start und Training,
 * damit ein angefangenes Workout nie "verloren" wirkt, wenn man die Ansicht wechselt.
 */
export function ActiveSessions() {
  const router = useRouter();
  const units = useSettings((state) => state.units);
  const activeWorkout = useWorkouts((state) => state.active);
  const activeRun = useRunStore((state) => state.active);
  const now = useNow(1_000, activeWorkout !== null || activeRun !== null);

  if (!activeWorkout && !activeRun) return null;

  return (
    <View style={styles.list}>
      {activeWorkout ? (
        <ActiveCard
          icon="barbell"
          title="Krafttraining läuft"
          text={`${activeWorkout.exercises.length} ${activeWorkout.exercises.length === 1 ? 'Übung' : 'Übungen'} · seit ${formatClock(now - activeWorkout.startedAt)}`}
          onPress={() => router.push('/training/workout')}
        />
      ) : null}
      {activeRun ? (
        <ActiveCard
          icon={activeRun.sport === 'ride' ? 'bicycle' : 'walk'}
          title={
            activeRun.sport === 'ride'
              ? activeRun.status === 'paused'
                ? 'Radfahrt pausiert'
                : 'Radfahrt läuft'
              : activeRun.status === 'paused'
                ? 'Lauf pausiert'
                : 'Lauf läuft'
          }
          text={`${formatDistance(activeRun.distanceM, units)} · ${formatClock(activeElapsedAt(activeRun, now))}`}
          onPress={() => router.push('/training/run')}
        />
      ) : null}
    </View>
  );
}

function ActiveCard({ icon, title, text, onPress }: { icon: IconName; title: string; text: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card
      onPress={onPress}
      style={[styles.row, { borderColor: theme.accent }]}
      accessibilityLabel={`${title}, ${text}. Fortsetzen`}>
      <View style={[styles.icon, { backgroundColor: theme.accent }]}>
        <Ionicons name={icon} size={22} color={theme.onAccent} />
      </View>
      <View style={styles.flex}>
        <AppText variant="eyebrow" color="accent">
          Läuft gerade
        </AppText>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="caption" color="textSecondary" style={styles.tabular}>
          {text}
        </AppText>
      </View>
      <AppText variant="label" color="accent">
        Fortsetzen
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 2 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
});
