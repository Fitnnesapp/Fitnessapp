import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CelebrationCard } from '@/components/celebration-card';
import { DetailHeader, StatGrid } from '@/components/detail-layout';
import { RouteMap } from '@/components/route-map';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { confirmAction } from '@/lib/confirm';
import { formatClock } from '@/lib/logic/format';
import { findRunRecords, kmSplits, paceSecPerKm } from '@/lib/logic/run-stats';
import { formatDistance, formatElevation, formatPace, paceUnitLabel } from '@/lib/logic/units';
import { useTheme } from '@/hooks/use-theme';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import type { RunRecordType } from '@/types/running';

const RECORD_LABELS: Record<RunRecordType, string> = {
  longest_distance: 'Längster Lauf',
  fastest_1k: 'Schnellster Kilometer',
  fastest_5k: 'Schnellste 5 km',
  fastest_10k: 'Schnellste 10 km',
};

type RunDetailProps = {
  runId: string | undefined;
  justFinished?: boolean;
};

/** Zusammenfassung eines Laufs mit Strecke, Kilometerzeiten und Rekorden. */
export function RunDetail({ runId, justFinished = false }: RunDetailProps) {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const history = useRunStore((state) => state.history);
  const deleteRun = useRunStore((state) => state.deleteRun);
  const run = history.find((r) => r.id === runId);

  const records = useMemo(
    () => findRunRecords([...history].sort((a, b) => a.startedAt - b.startedAt)),
    [history],
  );
  const splits = useMemo(() => (run ? kmSplits(run.points) : []), [run]);

  if (!run) {
    return (
      <Screen>
        <AppText variant="title">Lauf nicht gefunden</AppText>
      </Screen>
    );
  }

  const earned = records.get(run.id) ?? [];
  const avgPace = paceSecPerKm(run.distanceM, run.durationSeconds);
  const fastest = splits.length > 0 ? Math.min(...splits.map((s) => s.seconds)) : null;

  function confirmDelete() {
    confirmAction({
      title: 'Lauf löschen?',
      message: 'Der Lauf wird aus dem Verlauf entfernt.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        deleteRun(run!.id);
        router.back();
      },
    });
  }

  return (
    <Screen>
      {justFinished ? (
        <CelebrationCard sessionId={run.id} headline="Stark gelaufen!" records={earned.map((type) => RECORD_LABELS[type])} />
      ) : null}
      <DetailHeader startedAt={run.startedAt} title="Lauf" />

      {earned.length > 0 && !justFinished ? (
        <Card>
          {earned.map((type) => (
            <AppText key={type} variant="heading">
              🏆 {RECORD_LABELS[type]}
            </AppText>
          ))}
        </Card>
      ) : null}

      <RouteMap points={run.points} />

      <StatGrid
        items={[
          { label: 'Distanz', value: formatDistance(run.distanceM, units) },
          { label: 'Zeit', value: formatClock(run.durationSeconds * 1000) },
          { label: 'Ø Pace', value: formatPace(avgPace, units), unit: paceUnitLabel(units) },
          { label: 'Bester Kilometer', value: formatPace(fastest, units), unit: paceUnitLabel(units) },
          { label: 'Höhenmeter', value: formatElevation(run.elevationGainM, units) },
        ]}
      />

      {splits.length > 0 ? (
        <Card>
          <AppText variant="heading">Kilometerzeiten</AppText>
          {splits.map((split) => {
            const isFastest = split.seconds === fastest;
            // Schnellere Kilometer bekommen längere Balken (Kehrwert der Zeit)
            const share = fastest ? fastest / split.seconds : 0;
            return (
              <View
                key={split.km}
                style={styles.splitRow}
                accessible
                accessibilityLabel={`Kilometer ${split.km}: ${formatPace(split.seconds, 'metric')} ${paceUnitLabel('metric')}${isFastest ? ', schnellster' : ''}`}>
                <AppText color="textSecondary" style={styles.splitKm}>
                  {split.km}
                </AppText>
                <View style={styles.splitTrack}>
                  <View
                    style={[
                      styles.splitBar,
                      { width: `${Math.max(8, share * 100)}%`, backgroundColor: isFastest ? theme.accent : theme.accentSoft },
                    ]}
                  />
                </View>
                <AppText variant="label" color={isFastest ? 'accent' : 'text'} style={styles.splitPace}>
                  {formatPace(split.seconds, 'metric')}
                </AppText>
              </View>
            );
          })}
          <AppText variant="caption" color="textSecondary">
            Minuten pro vollem Kilometer, unabhängig von der Einheit. Längerer Balken heißt schneller.
          </AppText>
        </Card>
      ) : null}

      {justFinished ? <Button title="Fertig" onPress={() => router.replace('/training/running')} /> : null}
      <Button title="Lauf löschen" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  splitKm: { width: 22 },
  splitTrack: { flex: 1, height: 22, justifyContent: 'center' },
  splitBar: { height: 22, borderRadius: Radius.small },
  splitPace: { width: 44, textAlign: 'right' },
});
