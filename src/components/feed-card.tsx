import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { RouteMap } from '@/components/route-map';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import type { FeedItem } from '@/lib/logic/feed';
import { feedDayLabel } from '@/lib/logic/feed';
import { formatClock, formatDuration, formatTime } from '@/lib/logic/format';
import { formatDistance, formatElevation, formatPace, formatWeight, type Units } from '@/lib/logic/units';

type IconName = ComponentProps<typeof Ionicons>['name'];

const KIND: Record<FeedItem['kind'], { icon: IconName; label: string }> = {
  run: { icon: 'walk', label: 'Lauf' },
  strength: { icon: 'barbell', label: 'Kraft' },
  home: { icon: 'body', label: 'Home' },
};

const RUN_RECORD_LABEL = {
  longest_distance: 'Längster Lauf',
  fastest_1k: 'Schnellster Kilometer',
  fastest_5k: 'Schnellste 5 km',
  fastest_10k: 'Schnellste 10 km',
} as const;

type FeedCardProps = {
  item: FeedItem;
  name: string;
  now: number;
  units: Units;
  onPress: () => void;
};

/** Eine Einheit im Feed: wer, wann, was, drei große Kennzahlen und Rekorde (Aufbau wie bei Strava). */
export function FeedCard({ item, name, now, units, onPress }: FeedCardProps) {
  const theme = useTheme();
  const kind = KIND[item.kind];
  const stats = statsFor(item, units);
  const records = recordsFor(item);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <AppText variant="heading" color="accent">
            {(name.trim()[0] ?? 'D').toUpperCase()}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="heading" numberOfLines={1}>
            {name.trim() || 'Du'}
          </AppText>
          <View style={styles.meta}>
            <Ionicons name={kind.icon} size={14} color={theme.textSecondary} />
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {feedDayLabel(item.at, now)} um {formatTime(item.at)} · {kind.label}
            </AppText>
          </View>
        </View>
      </View>

      <AppText variant="title" numberOfLines={2}>
        {item.title}
      </AppText>

      <View style={styles.stats}>
        {stats.map((stat, i) => (
          <View
            key={stat.label}
            style={[styles.stat, i === 0 ? styles.firstStat : { borderLeftColor: theme.border, borderLeftWidth: StyleSheet.hairlineWidth }]}>
            <AppText variant="caption" color="textSecondary">
              {stat.label}
            </AppText>
            <AppText variant="heading" style={styles.tabular} numberOfLines={1}>
              {stat.value}
            </AppText>
          </View>
        ))}
      </View>

      {item.kind === 'run' && item.points.length >= 2 ? <RouteMap points={item.points} height={150} /> : null}

      {item.kind === 'strength' && item.exercises.length > 0 ? (
        <View style={styles.exercises}>
          {item.exercises.slice(0, 3).map((e) => (
            <AppText key={e.exerciseId} variant="caption" color="textSecondary" numberOfLines={1}>
              {e.sets} × {getExercise(e.exerciseId)?.name ?? e.exerciseId}
            </AppText>
          ))}
          {item.exercises.length > 3 ? (
            <AppText variant="caption" color="textSecondary">
              + {item.exercises.length - 3} weitere
            </AppText>
          ) : null}
        </View>
      ) : null}

      {item.kind === 'home' && !item.completed ? (
        <AppText variant="caption" color="textSecondary">
          Vorzeitig beendet, jede Minute zählt.
        </AppText>
      ) : null}

      {records.length > 0 ? (
        <View style={styles.records}>
          {records.map((label) => (
            <View key={label} style={[styles.record, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="trophy" size={14} color={theme.accent} />
              <AppText variant="label" color="accent">
                {label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function statsFor(item: FeedItem, units: Units): { label: string; value: string }[] {
  if (item.kind === 'run') {
    return [
      { label: 'Distanz', value: formatDistance(item.distanceM, units) },
      { label: 'Pace', value: `${formatPace(item.paceSecPerKm, units)} ${units === 'metric' ? '/km' : '/mi'}` },
      item.elevationGainM >= 10
        ? { label: 'Höhenmeter', value: formatElevation(item.elevationGainM, units) }
        : { label: 'Zeit', value: formatClock(item.durationSeconds * 1000) },
    ];
  }
  if (item.kind === 'strength') {
    return [
      { label: 'Volumen', value: formatWeight(item.volumeKg, units) },
      { label: 'Sätze', value: String(item.workingSets) },
      { label: 'Zeit', value: compactDuration(item.durationMs) },
    ];
  }
  return [
    { label: 'Zeit', value: compactDuration(item.activeSeconds * 1000) },
    { label: 'Kalorien', value: `ca. ${item.caloriesEstimate}` },
  ];
}

/** Kurz genug für eine Spalte: "55 Min" bzw. "1:05 h". */
function compactDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return formatDuration(ms);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')} h`;
}

function recordsFor(item: FeedItem): string[] {
  if (item.kind === 'run') return item.records.map((r) => RUN_RECORD_LABEL[r]);
  if (item.kind === 'strength' && item.recordCount > 0) {
    return [item.recordCount === 1 ? '1 Rekord' : `${item.recordCount} Rekorde`];
  }
  return [];
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  flex: { flex: 1, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, gap: 2, paddingHorizontal: Spacing.two },
  firstStat: { paddingLeft: 0 },
  exercises: { gap: 2 },
  records: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
});
