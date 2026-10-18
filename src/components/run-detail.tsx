import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { DetailHeader, StatGrid } from '@/components/detail-layout';
import { RouteMap } from '@/components/route-map';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { confirmAction } from '@/lib/confirm';
import { formatClock } from '@/lib/logic/format';
import { findRunRecords, kmSplits, paceSecPerKm } from '@/lib/logic/run-stats';
import { formatDistance, formatElevation, formatPace, paceUnitLabel } from '@/lib/logic/units';
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
      <DetailHeader startedAt={run.startedAt} title={justFinished ? 'Stark gelaufen!' : 'Lauf'} />

      {earned.length > 0 ? (
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
          {splits.map((split) => (
            <View key={split.km} style={styles.splitRow}>
              <AppText color="textSecondary">{split.km}</AppText>
              <AppText>
                {formatPace(split.seconds, 'metric')} {paceUnitLabel('metric')}
              </AppText>
            </View>
          ))}
          <AppText variant="caption" color="textSecondary">
            Pro vollem Kilometer, unabhängig von der Einheit.
          </AppText>
        </Card>
      ) : null}

      {justFinished ? <Button title="Fertig" onPress={() => router.replace('/training/running')} /> : null}
      <Button title="Lauf löschen" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  splitRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
