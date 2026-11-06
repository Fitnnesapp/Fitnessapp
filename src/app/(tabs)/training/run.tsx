import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useVoiceSplits } from '@/hooks/use-voice-splits';
import { confirmAction } from '@/lib/confirm';
import { formatClock } from '@/lib/logic/format';
import { activeElapsedAt, currentPace, isStandingStill, paceSecPerKm, speedKmh } from '@/lib/logic/run-stats';
import { formatDistance, formatPace, formatSpeed, paceUnitLabel, speedUnitLabel } from '@/lib/logic/units';
import { ensureTracking, stopTracking, type TrackingMode } from '@/lib/location/tracker';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';

type Signal = { label: string; color: 'success' | 'accent' | 'danger' | 'textSecondary' };

function signalOf(accuracy: number | null | undefined, ageMs: number | null): Signal {
  if (accuracy === undefined || ageMs === null) return { label: 'GPS wird gesucht …', color: 'textSecondary' };
  if (ageMs > 15000) return { label: 'Signal schwach, keine neuen Punkte', color: 'danger' };
  if (accuracy === null || accuracy <= 15) return { label: 'GPS-Signal gut', color: 'success' };
  return { label: 'GPS-Signal mittel', color: 'accent' };
}

export default function RunScreen() {
  const router = useRouter();
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const active = useRunStore((state) => state.active);
  const { pauseRun, resumeRun, finishRun, discardRun } = useRunStore.getState();

  const running = active?.status === 'running';
  const now = useNow(1000, active !== null);
  const [mode, setMode] = useState<TrackingMode | null>(null);
  const [trackingError, setTrackingError] = useState(false);
  const [saving, setSaving] = useState(false);

  // Aufzeichnung (wieder) starten, z.B. nach App-Neustart mitten im Lauf
  const hasRun = active !== null;
  useEffect(() => {
    if (!hasRun) return;
    ensureTracking()
      .then(setMode)
      .catch(() => setTrackingError(true));
  }, [hasRun]);

  const voiceOn = useSettings((state) => state.voiceSplits);
  const setVoiceSplits = useSettings((state) => state.setVoiceSplits);
  useVoiceSplits({
    active: running,
    distanceM: active?.distanceM ?? 0,
    elapsedMs: active ? activeElapsedAt(active, now) : 0,
    sport: active?.sport === 'ride' ? 'ride' : 'run',
  });

  // Beim Beenden wird active zuerst geleert; die Weiterleitung zur Zusammenfassung folgt danach.
  // Ohne diese Ausnahme würde die Umleitung hier der Zusammenfassung zuvorkommen.
  if (!active) return saving ? null : <Redirect href="/training/running" />;

  const ride = active.sport === 'ride';
  const pace = currentPace(active.points);
  const last = active.points[active.points.length - 1];
  // Auto-Pause: im Stand meldet das Handy keine Punkte; die Uhr bleibt dann beim letzten Punkt stehen.
  // Sobald es weitergeht, zieht die Aufzeichnung die Standzeit ab und die Uhr läuft nahtlos weiter.
  const standing = running && active.autoPause === true && isStandingStill(last?.t, now);
  const elapsedMs = activeElapsedAt(active, standing && last ? last.t : now);
  const signal = standing
    ? { label: 'Auto-Pause', color: 'accent' as const }
    : running
    ? signalOf(last ? last.acc : undefined, last ? now - last.t : null)
    : { label: 'Pausiert', color: 'textSecondary' as const };

  async function finish() {
    setSaving(true);
    const id = await finishRun();
    await stopTracking();
    if (id) {
      router.replace({ pathname: '/training/run-summary/[id]', params: { id } });
    } else {
      router.replace('/training/running');
    }
  }

  function confirmFinish() {
    const wasRunning = running;
    pauseRun();
    confirmAction({
      onCancel: wasRunning ? resumeRun : undefined,
      title: ride ? 'Radfahrt beenden?' : 'Lauf beenden?',
      message: ride
        ? 'Die Radfahrt wird gespeichert. Sehr kurze Aufzeichnungen unter 20 Metern werden verworfen.'
        : 'Der Lauf wird gespeichert. Sehr kurze Läufe unter 20 Metern werden verworfen.',
      confirmLabel: 'Beenden',
      destructive: false,
      onConfirm: finish,
    });
  }

  function confirmDiscard() {
    const wasRunning = running;
    pauseRun();
    confirmAction({
      onCancel: wasRunning ? resumeRun : undefined,
      title: ride ? 'Radfahrt verwerfen?' : 'Lauf verwerfen?',
      message: 'Die aufgezeichnete Strecke geht verloren.',
      confirmLabel: 'Verwerfen',
      onConfirm: async () => {
        discardRun();
        await stopTracking();
        router.replace('/training/running');
      },
    });
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.center}>
        <AppText variant="label" color={signal.color} accessibilityLiveRegion="polite">
          {signal.label.toUpperCase()}
        </AppText>
        <AppText variant="eyebrow" color="textSecondary">
          {ride ? 'RADFAHRT' : 'LAUF'}
        </AppText>
        <AppText style={styles.distance}>{formatDistance(active.distanceM, units).split(' ')[0]}</AppText>
        <AppText variant="heading" color="textSecondary">
          {units === 'metric' ? 'Kilometer' : 'Meilen'}
        </AppText>
      </View>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <AppText variant="label" color="textSecondary">
            ZEIT
          </AppText>
          <AppText variant="title">{formatClock(elapsedMs)}</AppText>
        </Card>
        {ride ? (
          <>
            <Card style={styles.stat}>
              <AppText variant="label" color="textSecondary">
                TEMPO JETZT
              </AppText>
              <AppText variant="title">{formatSpeed(running && pace ? 3600 / pace : 0, units)}</AppText>
              <AppText variant="caption" color="textSecondary">
                {speedUnitLabel(units)}
              </AppText>
            </Card>
            <Card style={styles.stat}>
              <AppText variant="label" color="textSecondary">
                Ø TEMPO
              </AppText>
              <AppText variant="title">{formatSpeed(speedKmh(active.distanceM, elapsedMs / 1000), units)}</AppText>
              <AppText variant="caption" color="textSecondary">
                {speedUnitLabel(units)}
              </AppText>
            </Card>
          </>
        ) : (
          <>
            <Card style={styles.stat}>
              <AppText variant="label" color="textSecondary">
                PACE JETZT
              </AppText>
              <AppText variant="title">{formatPace(running ? pace : null, units)}</AppText>
              <AppText variant="caption" color="textSecondary">
                {paceUnitLabel(units)}
              </AppText>
            </Card>
            <Card style={styles.stat}>
              <AppText variant="label" color="textSecondary">
                Ø PACE
              </AppText>
              <AppText variant="title">{formatPace(paceSecPerKm(active.distanceM, elapsedMs / 1000), units)}</AppText>
              <AppText variant="caption" color="textSecondary">
                {paceUnitLabel(units)}
              </AppText>
            </Card>
          </>
        )}
      </View>

      {mode === 'foreground' && Platform.OS !== 'web' ? (
        <Card>
          <AppText variant="heading">Nur im Vordergrund</AppText>
          <AppText color="textSecondary">
            Die Aufzeichnung läuft nur, solange die App offen und der Bildschirm an ist. Für Läufe mit gesperrtem
            Bildschirm wird „Immer erlauben“ für den Standort und ein Development Build gebraucht.
          </AppText>
        </Card>
      ) : null}

      {trackingError ? (
        <AppText color="danger" accessibilityRole="alert">
          Die GPS-Aufzeichnung konnte nicht gestartet werden. Prüfe die Standortfreigabe.
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: voiceOn }}
        accessibilityLabel="Sprachansagen pro Kilometer"
        onPress={() => setVoiceSplits(!voiceOn)}
        hitSlop={8}
        style={styles.voice}>
        <Ionicons name={voiceOn ? 'volume-high' : 'volume-mute'} size={18} color={theme.textSecondary} />
        <AppText variant="label" color="textSecondary">
          {voiceOn ? `Ansagen an · ${ride ? 'alle 5 km' : 'jeder km'}` : 'Ansagen aus'}
        </AppText>
      </Pressable>

      <Button title={running ? 'Pause' : 'Weiter'} onPress={running ? pauseRun : resumeRun} disabled={saving} />
      <Button
        title={ride ? 'Radfahrt beenden' : 'Lauf beenden'}
        variant="secondary"
        onPress={confirmFinish}
        loading={saving}
      />
      <Button title="Verwerfen" variant="ghost" onPress={confirmDiscard} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  voice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  content: { gap: Spacing.four },
  center: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.four },
  distance: { fontSize: 88, lineHeight: 96, fontWeight: '800', letterSpacing: -2 },
  stats: { gap: Spacing.two },
  stat: { padding: Spacing.three, gap: Spacing.one },
});
