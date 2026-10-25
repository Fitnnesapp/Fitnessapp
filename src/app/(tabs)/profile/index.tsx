import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Stat } from '@/components/ui/stat';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { streaks } from '@/lib/logic/activity';
import { formatClock } from '@/lib/logic/format';
import { trainingIdentity } from '@/lib/logic/identity';
import { memberSince, monthYear, personalBests } from '@/lib/logic/personal-bests';
import { GOAL_LABELS, LIMITATION_LABELS, planDayCount } from '@/lib/logic/plan';
import { displayToKg, formatDistance, formatWeight, kgToDisplay, parseNumber, weightUnitLabel } from '@/lib/logic/units';
import { lifetimeTotals } from '@/lib/logic/weekly-review';
import { requestReminderPermission, remindersSupported } from '@/lib/notifications';
import { useChallengeStore } from '@/lib/storage/challenge-store';
import { useGamification } from '@/lib/storage/gamification-store';
import { useHealthStore } from '@/lib/storage/health-store';
import { useHomeSessions } from '@/lib/storage/home-store';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings, type UnitsPreference } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

type IconName = ComponentProps<typeof Ionicons>['name'];

const UNITS: { value: UnitsPreference; label: string }[] = [
  { value: 'metric', label: 'kg · km' },
  { value: 'imperial', label: 'lb · mi' },
];

/**
 * Profil (Redesign 2.0), aufgebaut wie der "Du"-Bereich großer Sport-Apps: zuerst wer du bist
 * (Identität, Bilanz, Bestleistungen), dann dein Plan, dann Einstellungen und Datenschutz.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const { displayName, units, bodyWeightKg, setDisplayName, setUnits, setBodyWeightKg, reset: resetSettings } = useSettings();
  const strengthHistory = useWorkouts((state) => state.history);
  const runHistory = useRunStore((state) => state.history);
  const activities = useActivities();
  const { isPremium } = useSubscription();
  const resetWorkouts = useWorkouts((state) => state.reset);
  const resetHome = useHomeSessions((state) => state.reset);
  const resetRuns = useRunStore((state) => state.reset);
  const resetGamification = useGamification((state) => state.reset);
  const plan = usePlanStore((state) => state.plan);
  const resetPlan = usePlanStore((state) => state.reset);
  const resetChallenges = useChallengeStore((state) => state.reset);
  const health = useHealthStore();
  const streakReminder = useSettings((state) => state.streakReminder);
  const setStreakReminder = useSettings((state) => state.setStreakReminder);
  const [reminderDenied, setReminderDenied] = useState(false);

  const identity = useMemo(() => trainingIdentity(activities, now), [activities, now]);
  const lifetime = useMemo(() => lifetimeTotals(activities), [activities]);
  const streak = useMemo(() => streaks(activities, now), [activities, now]);
  const since = useMemo(() => memberSince(activities), [activities]);
  const bests = useMemo(() => personalBests(strengthHistory, runHistory), [strengthHistory, runHistory]);
  const name = displayName.trim();

  async function toggleReminder() {
    if (streakReminder) {
      setStreakReminder(false);
      return;
    }
    // Die Erlaubnis wird erst beim Einschalten angefragt
    const granted = await requestReminderPermission();
    setReminderDenied(!granted);
    setStreakReminder(granted);
  }

  // Eingabe bleibt Text, damit Zwischenstände wie "72," tippbar sind
  const [weightText, setWeightText] = useState(
    bodyWeightKg !== null ? String(kgToDisplay(bodyWeightKg, units)).replace('.', ',') : '',
  );

  function changeWeight(text: string) {
    setWeightText(text);
    const value = parseNumber(text);
    setBodyWeightKg(value !== null && value > 0 ? displayToKg(value, units) : null);
  }

  function confirmReset() {
    confirmAction({
      title: 'Alle Daten löschen?',
      message:
        'Name, Einstellungen, Trainingsplan, Gesundheitsangaben, Challenges, Workouts, Home-Workouts, Läufe, Abzeichen und Vorlagen werden von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        resetSettings();
        resetWorkouts();
        resetHome();
        resetRuns();
        resetGamification();
        resetPlan();
        resetChallenges();
        health.revoke();
        setWeightText('');
      },
    });
  }

  const hasBests = bests.heaviest || bests.longestRun || bests.fastest1k || bests.fastest5k;

  return (
    <Screen topInset>
      {/* 1. Identität */}
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <AppText variant="display" style={[styles.avatarText, { color: theme.onAccent }]}>
            {(name[0] ?? 'D').toUpperCase()}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="display" style={styles.name} numberOfLines={1}>
            {name || 'Du'}
          </AppText>
          {identity ? (
            <View style={[styles.pill, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="shield-checkmark" size={14} color={theme.accent} />
              <AppText variant="eyebrow" color="accent">
                Team {identity.team}
              </AppText>
            </View>
          ) : null}
          <AppText variant="caption" color="textSecondary">
            {since ? `Dabei seit ${monthYear(since)}` : 'Deine Geschichte beginnt mit der ersten Einheit.'}
            {isPremium ? ' · Premium' : ''}
          </AppText>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <Stat label="Einheiten" value={String(lifetime.sessions)} style={styles.flex} />
        <Stat label="Tage" value={String(lifetime.activeDays)} style={styles.flex} />
        <Stat label="Bestserie" value={String(streak.longest)} unit={streak.longest === 1 ? 'Tag' : 'Tage'} style={styles.flex} />
      </Card>

      {/* 2. Bestleistungen: eigene Rekorde sichtbar machen */}
      {hasBests ? (
        <>
          <SectionHeader title="Bestleistungen" />
          <View style={styles.bests}>
            {bests.heaviest ? (
              <BestTile
                icon="barbell"
                label={getExercise(bests.heaviest.exerciseId)?.name ?? 'Schwerstes Gewicht'}
                value={formatWeight(bests.heaviest.weightKg, units)}
                detail={`× ${bests.heaviest.reps}`}
              />
            ) : null}
            {bests.longestRun ? (
              <BestTile icon="walk" label="Längster Lauf" value={formatDistance(bests.longestRun.distanceM, units)} />
            ) : null}
            {bests.fastest1k ? <BestTile icon="flash" label="Schnellster km" value={formatClock(bests.fastest1k.seconds * 1000)} /> : null}
            {bests.fastest5k ? <BestTile icon="stopwatch" label="Schnellste 5 km" value={formatClock(bests.fastest5k.seconds * 1000)} /> : null}
          </View>
        </>
      ) : null}

      {/* 3. Plan */}
      <SectionHeader title="Dein Plan" />
      <Card onPress={() => router.push(plan ? '/plan' : '/plan/setup')} style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="calendar" size={22} color={theme.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">
            {plan ? `${plan.answers.goals.map((g) => GOAL_LABELS[g]).join(' + ')}` : 'Persönlichen Plan erstellen'}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {plan ? `${planDayCount(plan)} Tage pro Woche · ansehen oder anpassen` : 'Sechs kurze Fragen, dann steht dein Wochenplan.'}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </Card>

      {/* 4. Einstellungen */}
      <SectionHeader title="Einstellungen" />
      <Card style={styles.settings}>
        <TextField label="Name" value={displayName} onChangeText={setDisplayName} placeholder="Wie sollen wir dich nennen?" autoComplete="name" />
        <TextField
          label={`Körpergewicht in ${weightUnitLabel(units)} (optional)`}
          value={weightText}
          onChangeText={changeWeight}
          placeholder="Für genauere Kalorienwerte"
          keyboardType="decimal-pad"
        />
        <View style={styles.field}>
          <AppText variant="label" color="textSecondary">
            Einheiten
          </AppText>
          <View style={styles.chips}>
            {UNITS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={units === option.value}
                onPress={() => {
                  setUnits(option.value);
                  // Anzeige des Körpergewichts auf die neue Einheit umrechnen
                  setWeightText(bodyWeightKg !== null ? String(kgToDisplay(bodyWeightKg, option.value)).replace('.', ',') : '');
                }}
              />
            ))}
          </View>
        </View>
        {remindersSupported ? (
          <SettingRow
            icon="notifications"
            title="Serien-Erinnerung um 19 Uhr"
            text="Höchstens einmal am Tag, nur wenn du eine Serie hast und noch nicht trainiert hast."
            onPress={toggleReminder}>
            <Toggle on={streakReminder} />
          </SettingRow>
        ) : null}
        {reminderDenied ? (
          <AppText variant="caption" color="danger">
            Ohne Erlaubnis für Benachrichtigungen kann die Erinnerung nicht gesendet werden.
          </AppText>
        ) : null}
        <SettingRow
          icon="diamond"
          title="Premium"
          text={isPremium ? 'Aktiv · alle Programme und voller Verlauf' : 'Alle Programme, voller Verlauf, Testversion'}
          onPress={() => router.push('/profile/premium')}>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </SettingRow>
      </Card>

      {/* 5. Gesundheit und Datenschutz */}
      <SectionHeader title="Gesundheit & Daten" />
      <Card style={styles.settings}>
        <AppText variant="eyebrow" color="textSecondary">
          Gesundheitsangaben
        </AppText>
        {health.consentAt ? (
          <>
            <AppText>
              Eingewilligt am {new Date(health.consentAt).toLocaleDateString('de-DE')}.{' '}
              {health.age !== null ? `Alter: ${health.age}. ` : ''}
              {health.limitations.length > 0
                ? `Beschwerden: ${health.limitations.map((l) => LIMITATION_LABELS[l]).join(', ')}.`
                : 'Keine Beschwerden angegeben.'}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Nur auf diesem Gerät gespeichert und nur für deinen Trainingsplan verwendet.
            </AppText>
            <Button
              title="Einwilligung widerrufen"
              variant="danger"
              onPress={() =>
                confirmAction({
                  title: 'Einwilligung widerrufen?',
                  message:
                    'Alter, Beschwerden und Körpergewicht werden gelöscht. Erstelle danach deinen Plan neu, damit er ohne diese Angaben auskommt.',
                  confirmLabel: 'Widerrufen',
                  onConfirm: () => {
                    health.revoke();
                    setBodyWeightKg(null);
                    setWeightText('');
                  },
                })
              }
            />
          </>
        ) : (
          <>
            <AppText color="textSecondary">
              Keine Einwilligung. Wenn du Alter und Beschwerden angibst, wird dein Plan sicherer, z. B. ohne Sprünge bei
              Knieproblemen.
            </AppText>
            <Button title="Im Plan-Fragebogen angeben" variant="secondary" onPress={() => router.push('/plan/setup')} />
          </>
        )}

        <View style={[styles.privacy, { borderTopColor: theme.border }]}>
          <Ionicons name="lock-closed" size={20} color={theme.accent} />
          <View style={styles.flex}>
            <AppText variant="heading">Deine Daten bleiben bei dir</AppText>
            <AppText variant="caption" color="textSecondary">
              Alles wird nur auf diesem Gerät gespeichert. Es gibt kein Konto. Die App lädt nur die öffentliche
              Event-Liste aus dem Internet und sendet dabei keine Daten über dich.
            </AppText>
          </View>
        </View>
      </Card>

      <Button title="Alle Daten löschen" variant="danger" onPress={confirmReset} />
    </Screen>
  );
}

function BestTile({ icon, label, value, detail }: { icon: IconName; label: string; value: string; detail?: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.bestTile}>
      <Ionicons name={icon} size={20} color={theme.accent} />
      <AppText variant="label" color="textSecondary" numberOfLines={2}>
        {label}
      </AppText>
      <View style={styles.bestValue}>
        <AppText variant="number" style={styles.bestNumber}>
          {value}
        </AppText>
        {detail ? (
          <AppText variant="label" color="textSecondary">
            {detail}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

function SettingRow({ icon, title, text, onPress, children }: { icon: IconName; title: string; text: string; onPress: () => void; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <View style={styles.flex}>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="caption" color="textSecondary">
          {text}
        </AppText>
      </View>
      {children}
    </Pressable>
  );
}

/** Schalter-Optik ohne eigenen Zustand; der umgebende Eintrag ist tippbar. */
function Toggle({ on }: { on: boolean }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={[styles.toggle, { backgroundColor: on ? theme.accent : theme.surfaceAlt, borderColor: on ? theme.accent : theme.border }]}>
      <View style={[styles.knob, { backgroundColor: on ? theme.onAccent : theme.textSecondary, alignSelf: on ? 'flex-end' : 'flex-start' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },

  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, lineHeight: 46, fontWeight: '900' },
  name: { fontSize: 32, lineHeight: 36, fontWeight: '900' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    marginVertical: 2,
  },
  statsCard: { flexDirection: 'row', gap: Spacing.two },

  bests: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  bestTile: { flexBasis: '46%', flexGrow: 1, gap: Spacing.one },
  bestValue: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 4 },
  bestNumber: { fontSize: 24, lineHeight: 28, letterSpacing: -0.6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  settings: { gap: Spacing.three },
  field: { gap: Spacing.two },
  chips: { flexDirection: 'row', gap: Spacing.two },
  toggle: { width: 50, height: 30, borderRadius: 15, borderWidth: 1, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11 },
  privacy: { flexDirection: 'row', gap: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
});
