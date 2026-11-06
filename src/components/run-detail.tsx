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
import { paceDelta, paceDeltaText } from '@/lib/logic/announce';
import { findRunRecords, isRide, kmSplits, paceSecPerKm, speedKmh } from '@/lib/logic/run-stats';
import { formatDistance, formatElevation, formatPace, formatSpeed, paceUnitLabel, speedUnitLabel } from '@/lib/logic/units';
import { useTheme } from '@/hooks/use-theme';
import { canShare, shareText } from '@/lib/share';
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

const recordLabel = (type: RunRecordType, ride: boolean) =>
  ride && type === 'longest_distance' ? 'Längste Radfahrt' : RECORD_LABELS[type];

/** Zusammenfassung eines Laufs mit Strecke, Kilometerzeiten und Rekorden. */
export function RunDetail({ runId, justFinished = false }: RunDetailProps) {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const targetPace = useSettings((state) => state.targetPaceSecPerKm);
  const history = useRunStore((state) => state.history);
  const deleteRun = useRunStore((state) => state.deleteRun);
  const run = history.find((r) => r.id === runId);

  const records = useMemo(
    () =>
      findRunRecords(
        history
          .filter((r) => isRide(r) === (run ? isRide(run) : false))
          .sort((a, b) => a.startedAt - b.startedAt),
      ),
    [history, run],
  );
  const splits = useMemo(() => (run ? kmSplits(run.points) : []), [run]);

  if (!run) {
    return (
      <Screen>
        <AppText variant="title">Lauf nicht gefunden</AppText>
      </Screen>
    );
  }

  const ride = isRide(run);
  const earned = records.get(run.id) ?? [];
  const avgPace = paceSecPerKm(run.distanceM, run.durationSeconds);
  const delta = !ride && !run.manual ? paceDelta(avgPace, targetPace) : null;
  const fastest = splits.length > 0 ? Math.min(...splits.map((s) => s.seconds)) : null;

  function confirmDelete() {
    confirmAction({
      title: ride ? 'Radfahrt löschen?' : 'Lauf löschen?',
      message: ride ? 'Die Radfahrt wird aus dem Verlauf entfernt.' : 'Der Lauf wird aus dem Verlauf entfernt.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        deleteRun(run!.id);
        // Nach dem Löschen zurück, nach einem frisch beendeten Training gibt es keinen sinnvollen Rückweg
        if (!justFinished && router.canGoBack()) router.back();
        else router.replace('/history');
      },
    });
  }

  return (
    <Screen>
      {justFinished ? (
        <CelebrationCard
          sessionId={run.id}
          headline={ride ? 'Starke Tour!' : 'Stark gelaufen!'}
          records={earned.map((type) => recordLabel(type, ride))}
        />
      ) : null}
      <DetailHeader startedAt={run.startedAt} title={ride ? 'Radfahrt' : 'Lauf'} />

      {earned.length > 0 && !justFinished ? (
        <Card>
          {earned.map((type) => (
            <AppText key={type} variant="heading">
              🏆 {recordLabel(type, ride)}
            </AppText>
          ))}
        </Card>
      ) : null}

      {run.manual ? (
        <Card style={styles.manual}>
          <AppText variant="label" color="textSecondary">
            OHNE GPS NACHGETRAGEN
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Distanz und Zeit hast du selbst eingetragen. Strecke, Kilometerzeiten und Höhenmeter gibt es dafür nicht.
          </AppText>
        </Card>
      ) : (
        <RouteMap points={run.points} />
      )}

      <StatGrid
        items={[
          { label: 'Distanz', value: formatDistance(run.distanceM, units) },
          { label: 'Zeit', value: formatClock(run.durationSeconds * 1000) },
          ride
            ? { label: 'Ø Tempo', value: formatSpeed(speedKmh(run.distanceM, run.durationSeconds), units), unit: speedUnitLabel(units) }
            : { label: 'Ø Pace', value: formatPace(avgPace, units), unit: paceUnitLabel(units) },
          ...(run.manual
            ? []
            : [
                ...(ride
                  ? []
                  : [{ label: 'Bester Kilometer', value: formatPace(fastest, units), unit: paceUnitLabel(units) }]),
                { label: 'Höhenmeter', value: formatElevation(run.elevationGainM, units) },
              ]),
        ]}
      />

      {delta !== null && targetPace !== null ? (
        <Card style={styles.manual}>
          <AppText variant="label" color="textSecondary">
            ZIELTEMPO {formatPace(targetPace, units)} {paceUnitLabel(units)}
          </AppText>
          <AppText variant="heading" color={delta <= 2 ? 'accent' : 'text'}>
            {paceDeltaText(delta)}
          </AppText>
        </Card>
      ) : null}

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
                accessibilityLabel={`Kilometer ${split.km}: ${ride ? `${formatSpeed(3600 / split.seconds, 'metric')} km/h` : `${formatPace(split.seconds, 'metric')} ${paceUnitLabel('metric')}`}${isFastest ? ', schnellster' : ''}`}>
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
                  {ride ? formatSpeed(3600 / split.seconds, 'metric') : formatPace(split.seconds, 'metric')}
                </AppText>
              </View>
            );
          })}
          <AppText variant="caption" color="textSecondary">
            {ride
              ? 'Tempo in km/h je vollem Kilometer. Längerer Balken heißt schneller.'
              : 'Minuten pro vollem Kilometer, unabhängig von der Einheit. Längerer Balken heißt schneller.'}
          </AppText>
        </Card>
      ) : null}

      {!justFinished ? (
        <Button title={ride ? 'Neue Radtour starten' : 'Neuen Lauf starten'} onPress={() => router.push('/training/running')} />
      ) : null}
      {run.manual ? (
        <Button
          title={ride ? 'Radfahrt bearbeiten' : 'Lauf bearbeiten'}
          variant="secondary"
          onPress={() => router.push({ pathname: '/training/run-manual', params: { edit: run.id } })}
        />
      ) : null}
      {canShare() ? (
        <Button
          title={ride ? 'Radfahrt teilen' : 'Lauf teilen'}
          variant="secondary"
          onPress={() =>
            void shareText(
              ride
                ? `Radfahrt · ${formatDistance(run.distanceM, units)} in ${formatClock(run.durationSeconds * 1000)} · ` +
                    `Ø ${formatSpeed(speedKmh(run.distanceM, run.durationSeconds), units)} ${speedUnitLabel(units)}`
                : `Lauf · ${formatDistance(run.distanceM, units)} in ${formatClock(run.durationSeconds * 1000)} · ` +
                    `Ø ${formatPace(avgPace, units)} ${paceUnitLabel(units)}` +
                    (fastest !== null ? ` · schnellster km ${formatPace(fastest, 'metric')}` : ''),
            )
          }
        />
      ) : null}
      {justFinished ? <Button title="Fertig" onPress={() => router.replace('/training/running')} /> : null}
      <Button title={ride ? 'Radfahrt löschen' : 'Lauf löschen'} variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  manual: { gap: Spacing.one },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  splitKm: { width: 22 },
  splitTrack: { flex: 1, height: 22, justifyContent: 'center' },
  splitBar: { height: 22, borderRadius: Radius.small },
  splitPace: { width: 44, textAlign: 'right' },
});
