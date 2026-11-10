import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { ActiveSessions } from '@/components/active-sessions';
import { PaceCalculatorCard } from '@/components/pace-calculator-card';
import { RunGoalCard } from '@/components/run-goal-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { ImageCard } from '@/components/ui/image-card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { OnImage, Radius, Spacing } from '@/constants/theme';
import { SCENES } from '@/data/images';
import { RUN_IDEAS, type RunIdea } from '@/data/run-ideas';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { weekStart } from '@/lib/logic/activity';
import { formatDate } from '@/lib/logic/format';
import { formatRaceTime, PREDICTION_WINDOW_DAYS, predictRaces, runBestsSummary } from '@/lib/logic/run-insights';
import { isRide, onlyRuns, paceSecPerKm, speedKmh } from '@/lib/logic/run-stats';
import { formatDistance, formatPace, formatSpeed, paceUnitLabel, speedUnitLabel } from '@/lib/logic/units';
import { requestTrackingPermission } from '@/lib/location/tracker';
import { useRunStore } from '@/lib/storage/run-store';
import { primarySport } from '@/lib/logic/plan';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useSettings } from '@/lib/storage/settings-store';
import type { Sport } from '@/types/running';

const INTENSITY_COLOR: Record<RunIdea['intensity'], 'success' | 'accent' | 'danger'> = {
  Locker: 'success',
  Mittel: 'accent',
  Hart: 'danger',
};

export default function RunningScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const units = useSettings((state) => state.units);
  const autoPause = useSettings((state) => state.autoPause);
  const active = useRunStore((state) => state.active);
  const allSessions = useRunStore((state) => state.history);
  // Bestzeiten, Prognose und Laufziel nur aus Läufen; Radfahrten erscheinen in der Liste darunter
  const history = useMemo(() => onlyRuns(allSessions), [allSessions]);
  const startRun = useRunStore((state) => state.startRun);

  // Steht heute eine Radfahrt im Plan oder setzt der Plan ganz aufs Rad, ist die Radtour die Hauptaktion
  const plan = usePlanStore((state) => state.plan);
  const primary: Sport = plan ? primarySport(plan, now) : 'run';
  const rideFirst = primary === 'ride';

  const hasRides = useMemo(() => allSessions.some(isRide), [allSessions]);
  const rideGoalSet = useSettings((state) => state.weeklyRideGoalM !== null);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const bests = useMemo(() => runBestsSummary(history), [history]);
  const prediction = useMemo(() => predictRaces(history, now), [history, now]);
  const currentWeekStart = weekStart(now);
  const weekM = useMemo(
    () => history.filter((run) => run.startedAt >= currentWeekStart).reduce((sum, run) => sum + run.distanceM, 0),
    [history, currentWeekStart],
  );
  const weekRideM = useMemo(
    () =>
      allSessions
        .filter((session) => isRide(session) && session.startedAt >= currentWeekStart)
        .reduce((sum, session) => sum + session.distanceM, 0),
    [allSessions, currentWeekStart],
  );
  // Tage bis einschließlich Sonntag
  const daysLeft = 7 - ((new Date(now).getDay() + 6) % 7);
  const recent = useMemo(
    () => [...allSessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 3),
    [allSessions],
  );

  async function start(sport: Sport = 'run') {
    setBusy(true);
    try {
      // Die Berechtigung wird erst jetzt angefragt, wo der Zweck klar ist
      const result = await requestTrackingPermission();
      if (result === 'denied') {
        setDenied(true);
        return;
      }
      setDenied(false);
      startRun(sport, autoPause);
      router.push('/training/run');
    } finally {
      setBusy(false);
    }
  }

  const tiles = [
    { label: '1 km', value: bests.k1 !== null ? formatRaceTime(bests.k1) : '–' },
    { label: '5 km', value: bests.k5 !== null ? formatRaceTime(bests.k5) : '–' },
    { label: '10 km', value: bests.k10 !== null ? formatRaceTime(bests.k10) : '–' },
    { label: 'Längster', value: bests.longestM > 0 ? formatDistance(bests.longestM, units) : '–' },
  ];

  return (
    <Screen>
      <AppText variant="display" style={styles.headline}>
        Laufen & Rad
      </AppText>

      {active ? (
        <ActiveSessions />
      ) : (
        <FadeIn>
          <ImageCard
            source={SCENES['hero-lauf']}
            height={300}
            onPress={busy ? undefined : () => void start(primary)}
            accessibilityLabel={rideFirst ? 'Radtour starten' : 'Lauf starten'}>
            <AppText variant="eyebrow" style={{ color: OnImage.accent }}>
              {(rideFirst ? weekRideM : weekM) > 0
                ? `DIESE WOCHE ${formatDistance(rideFirst ? weekRideM : weekM, units).toUpperCase()}${rideFirst ? ' AUF DEM RAD' : ''}`
                : 'BEREIT?'}
            </AppText>
            <AppText variant="display" style={styles.heroTitle}>
              {rideFirst ? 'Rauf aufs Rad' : history.length === 0 ? 'Dein erster Lauf' : 'Raus mit dir'}
            </AppText>
            <AppText style={styles.onImageSoft}>
              {rideFirst
                ? 'Distanz, Geschwindigkeit und Höhenmeter per GPS. Die Strecke bleibt auf deinem Handy.'
                : 'Distanz, Tempo, Kilometerzeiten und Höhenmeter per GPS. Die Strecke bleibt auf deinem Handy.'}
            </AppText>
            <View style={[styles.cta, { backgroundColor: OnImage.accent }]}>
              <Ionicons name="play" size={20} color={OnImage.onAccent} />
              <AppText variant="heading" style={{ color: OnImage.onAccent }}>
                {busy ? 'Einen Moment …' : rideFirst ? 'Radtour starten' : 'Lauf starten'}
              </AppText>
            </View>
          </ImageCard>
        </FadeIn>
      )}

      {!active ? (
        <Button
          title={rideFirst ? 'Lauf mit GPS starten' : 'Radtour mit GPS starten'}
          variant="secondary"
          disabled={busy}
          onPress={() => void start(rideFirst ? 'run' : 'ride')}
        />
      ) : null}

      {!active ? (
        <Button
          title="Lauf oder Radfahrt ohne GPS nachtragen"
          variant="ghost"
          onPress={() => router.push('/training/run-manual')}
        />
      ) : null}

      {rideFirst ? <RunGoalCard sport="ride" weekM={weekRideM} weekStartAt={currentWeekStart} daysLeft={daysLeft} /> : null}
      <RunGoalCard weekM={weekM} weekStartAt={currentWeekStart} daysLeft={daysLeft} />
      {!rideFirst && (hasRides || rideGoalSet) ? (
        <RunGoalCard sport="ride" weekM={weekRideM} weekStartAt={currentWeekStart} daysLeft={daysLeft} />
      ) : null}

      {denied ? (
        <Card>
          <AppText color="danger" accessibilityRole="alert">
            Ohne Standortfreigabe kann kein Lauf aufgezeichnet werden.
          </AppText>
          {Platform.OS !== 'web' ? (
            <Button title="Einstellungen öffnen" variant="secondary" onPress={() => Linking.openSettings()} />
          ) : null}
        </Card>
      ) : null}

      {bests.count > 0 ? (
        <>
          <SectionHeader title="Bestzeiten" />
          <View style={styles.grid}>
            {tiles.map((tile) => (
              <Card key={tile.label} style={styles.tile}>
                <AppText variant="eyebrow" color="textSecondary">
                  {tile.label}
                </AppText>
                <AppText variant="number" style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
                  {tile.value}
                </AppText>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {prediction ? (
        <Card>
          <AppText variant="eyebrow" color="textSecondary">
            Was heute drin wäre
          </AppText>
          {prediction.races.map((race) => (
            <View key={race.label} style={[styles.raceRow, { borderBottomColor: theme.border }]}>
              <AppText style={styles.flex}>{race.label}</AppText>
              <AppText variant="heading">{formatRaceTime(race.seconds)}</AppText>
              <AppText variant="caption" color="textSecondary" style={styles.racePace} numberOfLines={1}>
                {formatPace(race.seconds / (race.meters / 1000), units)} /{units === 'metric' ? 'km' : 'mi'}
              </AppText>
            </View>
          ))}
          <AppText variant="caption" color="textSecondary">
            Schätzung mit der Riegel-Formel aus deinem stärksten Lauf der letzten {PREDICTION_WINDOW_DAYS} Tage (
            {formatDistance(prediction.basis.meters, units)} in {formatRaceTime(prediction.basis.seconds)}). Für längere
            Strecken braucht es entsprechendes Training.
          </AppText>
        </Card>
      ) : null}

      <PaceCalculatorCard />

      <SectionHeader title="Lauf-Ideen" />
      <AppText color="textSecondary">Rund 80 % locker, 20 % fordernd: so trainieren auch Profis.</AppText>
      <Button
        title="Intervall-Timer für Tempoläufe"
        variant="secondary"
        onPress={() => router.push('/training/timer')}
      />
      {RUN_IDEAS.map((idea) => (
        <Card key={idea.id}>
          <View style={styles.ideaHead}>
            <View style={[styles.badge, { borderColor: theme[INTENSITY_COLOR[idea.intensity]] }]}>
              <AppText variant="label" color={INTENSITY_COLOR[idea.intensity]}>
                {idea.intensity}
              </AppText>
            </View>
            <AppText variant="caption" color="textSecondary">
              {idea.minutes}
            </AppText>
          </View>
          <AppText variant="heading">{idea.name}</AppText>
          <AppText>{idea.how}</AppText>
          <AppText variant="caption" color="textSecondary">
            {idea.why}
          </AppText>
        </Card>
      ))}

      {recent.length > 0 ? (
        <>
          <SectionHeader title="Letzte Einheiten" action={{ label: 'Alle', onPress: () => router.push('/history') }} />
          {recent.map((run) => (
            <Card
              key={run.id}
              style={styles.runRow}
              onPress={() => router.push({ pathname: '/history/[id]', params: { id: run.id } })}
              accessibilityLabel={`${isRide(run) ? 'Radfahrt' : 'Lauf'} vom ${formatDate(run.startedAt)}`}>
              <Ionicons name={isRide(run) ? 'bicycle-outline' : 'walk-outline'} size={22} color={theme.accent} />
              <View style={styles.flex}>
                <AppText variant="heading">{formatDistance(run.distanceM, units)}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {formatDate(run.startedAt)}
                  {run.manual ? ' · nachgetragen' : ''}
                </AppText>
              </View>
              <AppText variant="caption" color="textSecondary">
                {isRide(run)
                  ? `${formatSpeed(speedKmh(run.distanceM, run.durationSeconds), units)} ${speedUnitLabel(units)}`
                  : `${formatPace(paceSecPerKm(run.distanceM, run.durationSeconds), units)} ${paceUnitLabel(units)}`}
              </AppText>
            </Card>
          ))}
        </>
      ) : null}

      <Card style={{ backgroundColor: theme.surfaceAlt }}>
        <AppText variant="label" color="textSecondary">
          WOZU DER STANDORT?
        </AppText>
        <AppText variant="caption" color="textSecondary">
          Nur während eines Laufs zeichnet die App deine Strecke per GPS auf. Damit es auch bei gesperrtem Bildschirm
          weiterläuft, wähle bei der Abfrage „Immer erlauben“ (iOS) bzw. „Immer zulassen“ (Android). Mit „Nur bei
          Nutzung“ läuft die Aufzeichnung nur, solange die App offen ist.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '900' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.85 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: { flexGrow: 1, flexBasis: '45%', padding: Spacing.three, gap: 2 },
  tileValue: { fontSize: 26, lineHeight: 30 },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  racePace: { width: 72, textAlign: 'right' },
  flex: { flex: 1 },
  ideaHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  runRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
});
