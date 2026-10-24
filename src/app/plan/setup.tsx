import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { OptionCard } from '@/components/ui/option-card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { FREE_PROGRAM_IDS, PROGRAMS } from '@/data/programs';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import {
  buildPlan,
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  LIMITATION_LABELS,
  PLACE_LABELS,
  recommendedDayCount,
  recommendedDays,
  weekdayOf,
  WEEKDAY_SHORT,
  type HomeEquipment,
  type Limitation,
  type PlanGoal,
  type PlanLevel,
  type PlanPlace,
  type PlanTime,
  type RunExperience,
} from '@/lib/logic/plan';
import { displayToKg, kgToDisplay, parseNumber, weightUnitLabel } from '@/lib/logic/units';
import { useHealthStore } from '@/lib/storage/health-store';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useSettings } from '@/lib/storage/settings-store';

type IconName = ComponentProps<typeof Ionicons>['name'];

const GOALS: { value: PlanGoal; hint: string; icon: IconName }[] = [
  { value: 'muskeln', hint: 'Stärker werden und Muskeln aufbauen', icon: 'barbell' },
  { value: 'ausdauer', hint: 'Schneller und weiter laufen', icon: 'walk' },
  { value: 'abnehmen', hint: 'Kraft und Ausdauer kombiniert', icon: 'flame' },
  { value: 'fitness', hint: 'Abwechslungsreich in Form bleiben', icon: 'heart' },
  { value: 'beweglichkeit', hint: 'Mobility, Rumpf und weniger Verspannung', icon: 'body' },
];

const LEVELS: { value: PlanLevel; title: string; hint: string; icon: IconName }[] = [
  { value: 'einsteiger', title: 'Einsteiger', hint: 'Neu dabei oder länger raus', icon: 'leaf' },
  { value: 'fortgeschritten', title: 'Fortgeschritten', hint: 'Trainiere seit Monaten regelmäßig', icon: 'trending-up' },
];

const PLACES: { value: PlanPlace; hint: string; icon: IconName }[] = [
  { value: 'studio', hint: 'Hanteln, Geräte, Laufband', icon: 'business' },
  { value: 'zuhause', hint: 'Im Wohnzimmer, mit oder ohne Geräte', icon: 'home' },
  { value: 'draussen', hint: 'Laufen im Park oder auf der Straße', icon: 'leaf' },
];

const EQUIPMENT: HomeEquipment[] = ['kurzhanteln', 'kettlebell', 'widerstandsband', 'klimmzugstange'];

const RUN_LEVELS: { value: RunExperience; title: string; hint: string }[] = [
  { value: 'keine', title: 'Ich laufe noch nicht', hint: 'Start mit Gehen und Laufen im Wechsel' },
  { value: 'bis5', title: 'Bis 5 km', hint: '5 km schaffe ich am Stück' },
  { value: 'bis10', title: 'Bis 10 km', hint: '10 km sind drin' },
  { value: 'mehr', title: 'Mehr als 10 km', hint: 'Halbmarathon und weiter' },
];

const LIMITATIONS: Limitation[] = ['knie', 'ruecken', 'schulter', 'herzkreislauf'];

const MINUTES = [20, 30, 45, 60];

const TIMES: { value: PlanTime; title: string; icon: IconName }[] = [
  { value: 'morgens', title: 'Morgens', icon: 'sunny' },
  { value: 'mittags', title: 'Mittags', icon: 'partly-sunny' },
  { value: 'abends', title: 'Abends', icon: 'moon' },
];

type Step = 'goals' | 'level' | 'places' | 'run' | 'health' | 'days' | 'time' | 'start';

/**
 * Einstieg mit kurzen, klaren Fragen; nur die Schritte, die für die Person wichtig sind.
 * Gestaltung nach Studien:
 * - wenige Antworten pro Frage und eine markierte Empfehlung, damit die Wahl leicht fällt
 * - Fortschrittsbalken, der beim Öffnen schon einen Abschnitt zeigt (Endowed Progress, Nunes & Drèze 2006)
 * - Tag und Tageszeit werden festgelegt, daraus entstehen Wenn-Dann-Pläne (Gollwitzer & Sheeran 2006)
 * - Start am Montag als bewusster Neuanfang (Neustart-Effekt, Dai, Milkman & Riis 2014)
 * - Gesundheitsangaben nur nach ausdrücklicher Einwilligung (Art. 9 DSGVO), alles bleibt auf dem Gerät
 */
export default function PlanSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const { isPremium } = useSubscription();
  const setPlan = usePlanStore((state) => state.setPlan);
  const skip = usePlanStore((state) => state.skipOnboarding);
  const previous = usePlanStore((state) => state.plan);
  const health = useHealthStore();
  const units = useSettings((state) => state.units);
  const bodyWeightKg = useSettings((state) => state.bodyWeightKg);
  const setBodyWeightKg = useSettings((state) => state.setBodyWeightKg);

  const prev = previous?.answers;
  const [index, setIndex] = useState(0);
  const [goals, setGoals] = useState<PlanGoal[]>(prev?.goals ?? []);
  const [level, setLevel] = useState<PlanLevel | null>(prev?.level ?? null);
  const [places, setPlaces] = useState<PlanPlace[]>(prev?.places ?? []);
  const [equipment, setEquipment] = useState<HomeEquipment[]>(prev?.equipment ?? []);
  const [runExperience, setRunExperience] = useState<RunExperience>(prev?.runExperience ?? 'bis5');
  const [consent, setConsent] = useState<boolean | null>(health.consentAt ? true : null);
  const [ageText, setAgeText] = useState(health.age !== null ? String(health.age) : '');
  const [weightText, setWeightText] = useState(
    bodyWeightKg !== null ? String(kgToDisplay(bodyWeightKg, units)).replace('.', ',') : '',
  );
  const [limitations, setLimitations] = useState<Limitation[]>(health.limitations);
  const [noLimitations, setNoLimitations] = useState(health.consentAt !== null && health.limitations.length === 0);
  const [days, setDays] = useState<number[] | null>(prev?.days ?? null);
  const [doubleSessions, setDoubleSessions] = useState(prev?.doubleSessions ?? false);
  const [minutes, setMinutes] = useState(prev?.minutes ?? 30);
  const [time, setTime] = useState<PlanTime>(prev?.time ?? 'abends');
  const [startNextMonday, setStartNextMonday] = useState(false);

  const runningLikely =
    (places.includes('draussen') || places.includes('studio')) &&
    goals.some((g) => g === 'ausdauer' || g === 'abnehmen' || g === 'fitness');

  const steps = useMemo<Step[]>(
    () => ['goals', 'level', 'places', ...(runningLikely ? (['run'] as Step[]) : []), 'health', 'days', 'time', 'start'],
    [runningLikely],
  );
  const step = steps[Math.min(index, steps.length - 1)];

  const recommendedCount = goals[0] && level ? recommendedDayCount(goals[0], level) : 3;
  const chosenDays = days ?? recommendedDays(recommendedCount);
  const isMonday = weekdayOf(now) === 0;
  const age = parseNumber(ageText);
  const ageValid = ageText.trim() === '' || (age !== null && age >= 14 && age <= 100);

  const canContinue = (() => {
    switch (step) {
      case 'goals':
        return goals.length > 0;
      case 'level':
        return level !== null;
      case 'places':
        return places.length > 0;
      case 'health':
        return consent === false || (consent === true && ageValid);
      case 'days':
        return chosenDays.length > 0;
      default:
        return true;
    }
  })();

  function toggle<T>(list: T[], value: T, max = 99): T[] {
    if (list.includes(value)) return list.filter((v) => v !== value);
    return list.length >= max ? [...list.slice(1), value] : [...list, value];
  }

  function finish() {
    if (!level) return;
    const withConsent = consent === true;
    const body = withConsent ? { age: age !== null && ageValid ? Math.round(age) : null, limitations } : null;

    // Gesundheitsangaben nur mit Einwilligung speichern; bei Nein alles Bisherige löschen
    if (withConsent) {
      if (!health.consentAt) health.giveConsent(now);
      useHealthStore.getState().setAge(body?.age ?? null);
      useHealthStore.getState().setLimitations(limitations);
      const weight = parseNumber(weightText);
      if (weight !== null && weight > 0) setBodyWeightKg(displayToKg(weight, units));
    } else if (health.consentAt) {
      health.revoke();
    }

    const plan = buildPlan(
      { goals, level, places, equipment, runExperience, days: chosenDays, doubleSessions, minutes, time, body },
      {
        allowedProgramIds: isPremium ? PROGRAMS.map((p) => p.id) : FREE_PROGRAM_IDS,
        programs: PROGRAMS,
        now,
        startNextMonday: startNextMonday && !isMonday,
      },
    );
    setPlan(plan);
    router.replace({ pathname: '/plan', params: { neu: '1' } });
  }

  function next() {
    if (index < steps.length - 1) setIndex(index + 1);
    else finish();
  }

  function leave() {
    skip();
    if (router.canGoBack()) router.back();
    else router.replace('/dashboard');
  }

  return (
    <Screen topInset scroll={false} contentStyle={styles.screen}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={index === 0 ? 'Schließen' : 'Zurück'}
          onPress={index === 0 ? leave : () => setIndex(index - 1)}
          hitSlop={12}>
          <Ionicons name={index === 0 ? 'close' : 'chevron-back'} size={26} color={theme.text} />
        </Pressable>
        {/* Ein Abschnitt mehr als Fragen: der erste ist mit dem Öffnen schon geschafft */}
        <View style={styles.segments} accessibilityLabel={`Schritt ${index + 1} von ${steps.length}`}>
          {Array.from({ length: steps.length + 1 }, (_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: i <= index ? theme.accent : theme.surfaceAlt }]} />
          ))}
        </View>
        {index === 0 && !previous ? (
          <Pressable accessibilityRole="button" onPress={leave} hitSlop={12}>
            <AppText variant="label" color="textSecondary">
              Später
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'goals' ? (
          <>
            <AppText variant="label" color="accent">
              DEIN PERSÖNLICHER PLAN · 2 MINUTEN
            </AppText>
            <AppText variant="title">Was möchtest du erreichen?</AppText>
            <AppText color="textSecondary">Wähle ein oder zwei Ziele. Das erste wird dein Schwerpunkt.</AppText>
            {GOALS.map((g) => {
              const position = goals.indexOf(g.value);
              return (
                <OptionCard
                  key={g.value}
                  title={GOAL_LABELS[g.value]}
                  hint={g.hint}
                  icon={g.icon}
                  selected={position >= 0}
                  tag={position === 0 && goals.length > 1 ? 'Schwerpunkt' : position === 1 ? 'Dazu' : undefined}
                  onPress={() => {
                    setGoals(toggle(goals, g.value, 2));
                    setDays(null);
                  }}
                />
              );
            })}
          </>
        ) : null}

        {step === 'level' ? (
          <>
            <AppText variant="title">Wie viel Erfahrung hast du?</AppText>
            {LEVELS.map((l) => (
              <OptionCard
                key={l.value}
                title={l.title}
                hint={l.hint}
                icon={l.icon}
                selected={level === l.value}
                onPress={() => {
                  setLevel(l.value);
                  setDays(null);
                }}
              />
            ))}
          </>
        ) : null}

        {step === 'places' ? (
          <>
            <AppText variant="title">Wo trainierst du?</AppText>
            <AppText color="textSecondary">Mehrfachauswahl möglich. Der Plan verteilt die Einheiten passend.</AppText>
            {PLACES.map((p) => (
              <OptionCard
                key={p.value}
                title={PLACE_LABELS[p.value]}
                hint={p.hint}
                icon={p.icon}
                selected={places.includes(p.value)}
                onPress={() => setPlaces(toggle(places, p.value))}
              />
            ))}
            {places.includes('zuhause') ? (
              <View style={styles.group}>
                <AppText variant="heading">Was hast du zu Hause?</AppText>
                <View style={styles.chips}>
                  {EQUIPMENT.map((e) => (
                    <Chip key={e} label={EQUIPMENT_LABELS[e]} selected={equipment.includes(e)} onPress={() => setEquipment(toggle(equipment, e))} />
                  ))}
                </View>
                <AppText variant="caption" color="textSecondary">
                  {equipment.length === 0 ? 'Nichts ausgewählt: Der Plan setzt auf Übungen ohne Geräte.' : 'Krafteinheiten nutzen deine Geräte.'}
                </AppText>
              </View>
            ) : null}
          </>
        ) : null}

        {step === 'run' ? (
          <>
            <AppText variant="title">Wie weit läufst du aktuell?</AppText>
            <AppText color="textSecondary">Damit Läufe weder unter- noch überfordern.</AppText>
            {RUN_LEVELS.map((r) => (
              <OptionCard key={r.value} title={r.title} hint={r.hint} selected={runExperience === r.value} onPress={() => setRunExperience(r.value)} />
            ))}
          </>
        ) : null}

        {step === 'health' ? (
          <>
            <AppText variant="title">Gesundheit berücksichtigen?</AppText>
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={22} color={theme.accent} />
                <AppText variant="heading" style={styles.flex}>
                  Freiwillig und nur auf deinem Gerät
                </AppText>
              </View>
              <AppText variant="caption" color="textSecondary">
                Mit Alter, Gewicht und Beschwerden wird dein Plan sicherer: Bei Knieproblemen etwa ohne Sprünge, bei
                Rückenbeschwerden mit mehr Rumpftraining. Diese Gesundheitsdaten speichern wir nur mit deiner
                ausdrücklichen Einwilligung, ausschließlich auf diesem Gerät, und du kannst sie im Profil jederzeit
                widerrufen. Dann werden sie gelöscht.
              </AppText>
            </View>
            <OptionCard
              title="Ja, ich willige ein"
              hint="Gesundheitsangaben für meinen Plan verwenden"
              icon="checkmark-done"
              selected={consent === true}
              onPress={() => setConsent(true)}
            />
            <OptionCard
              title="Nein, ohne Gesundheitsdaten"
              hint="Der Plan nutzt nur Ziele, Zeit und Erfahrung"
              icon="close-circle"
              selected={consent === false}
              onPress={() => setConsent(false)}
            />
            {consent ? (
              <View style={styles.group}>
                <View style={styles.inputRow}>
                  <View style={styles.flex}>
                    <TextField
                      label="Alter (optional)"
                      value={ageText}
                      onChangeText={setAgeText}
                      keyboardType="number-pad"
                      placeholder="z. B. 34"
                      error={ageValid ? undefined : 'Bitte ein Alter zwischen 14 und 100.'}
                    />
                  </View>
                  <View style={styles.flex}>
                    <TextField
                      label={`Gewicht in ${weightUnitLabel(units)} (optional)`}
                      value={weightText}
                      onChangeText={setWeightText}
                      keyboardType="decimal-pad"
                      placeholder="für Kalorien"
                    />
                  </View>
                </View>
                <AppText variant="heading">Hast du Beschwerden?</AppText>
                <View style={styles.chips}>
                  <Chip
                    label="Keine"
                    selected={noLimitations}
                    onPress={() => {
                      setNoLimitations(true);
                      setLimitations([]);
                    }}
                  />
                  {LIMITATIONS.map((l) => (
                    <Chip
                      key={l}
                      label={LIMITATION_LABELS[l]}
                      selected={limitations.includes(l)}
                      onPress={() => {
                        setNoLimitations(false);
                        setLimitations(toggle(limitations, l));
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {step === 'days' ? (
          <>
            <AppText variant="title">An welchen Tagen trainierst du?</AppText>
            <AppText color="textSecondary">
              Empfohlen sind {recommendedCount} Tage mit Pausen dazwischen. Einzelne Tage kannst du danach im Plan
              selbst belegen.
            </AppText>
            <View style={styles.weekRow}>
              {WEEKDAY_SHORT.map((label, day) => {
                const on = chosenDays.includes(day);
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={label}
                    onPress={() => setDays(toggle(chosenDays, day).sort((a, b) => a - b))}
                    style={[
                      styles.weekDay,
                      { backgroundColor: on ? theme.accent : theme.surface, borderColor: on ? theme.accent : theme.border },
                    ]}>
                    <AppText variant="heading" style={{ color: on ? theme.onAccent : theme.text }}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText variant="caption" color={chosenDays.length > 5 ? 'accent' : 'textSecondary'}>
              {chosenDays.length === 0
                ? 'Wähle mindestens einen Tag.'
                : chosenDays.length > 5
                  ? `${chosenDays.length} Tage sind viel. Plane mindestens einen Ruhetag ein.`
                  : `${chosenDays.length} ${chosenDays.length === 1 ? 'Trainingstag' : 'Trainingstage'} pro Woche`}
            </AppText>
            <View style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.flex}>
                <AppText variant="heading">Zwei Einheiten an einem Tag</AppText>
                <AppText variant="caption" color="textSecondary">
                  An einigen Tagen kommt eine kurze zweite Einheit dazu, z. B. 15 Minuten Lauf nach dem Krafttraining.
                </AppText>
              </View>
              <Switch
                value={doubleSessions}
                onValueChange={setDoubleSessions}
                trackColor={{ true: theme.accent, false: theme.surfaceAlt }}
                thumbColor={theme.surface}
                accessibilityLabel="Zwei Einheiten an einem Tag"
              />
            </View>
          </>
        ) : null}

        {step === 'time' ? (
          <>
            <AppText variant="title">Wie viel Zeit hast du pro Einheit?</AppText>
            <View style={styles.minuteRow}>
              {MINUTES.map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: minutes === m }}
                  onPress={() => setMinutes(m)}
                  style={[
                    styles.minute,
                    { backgroundColor: minutes === m ? theme.accent : theme.surface, borderColor: minutes === m ? theme.accent : theme.border },
                  ]}>
                  <AppText variant="title" style={{ color: minutes === m ? theme.onAccent : theme.text }}>
                    {m}
                  </AppText>
                  <AppText variant="caption" style={{ color: minutes === m ? theme.onAccent : theme.textSecondary }}>
                    Min
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="title" style={styles.secondQuestion}>
              Wann trainierst du meistens?
            </AppText>
            <AppText color="textSecondary">
              Eine feste Zeit macht aus dem Vorsatz einen Plan: „Wenn es Montagabend ist, trainiere ich.“
            </AppText>
            {TIMES.map((t) => (
              <OptionCard key={t.value} title={t.title} icon={t.icon} selected={time === t.value} onPress={() => setTime(t.value)} />
            ))}
          </>
        ) : null}

        {step === 'start' ? (
          <>
            <AppText variant="title">Wann geht es los?</AppText>
            <OptionCard
              title="Heute"
              hint="Gleich mit dem ersten Tag starten"
              icon="flash"
              selected={!startNextMonday || isMonday}
              onPress={() => setStartNextMonday(false)}
            />
            {isMonday ? null : (
              <OptionCard
                title="Am Montag"
                hint="Neue Woche, neuer Anfang. Ein klarer Starttag hilft vielen beim Durchhalten."
                icon="calendar"
                tag="Neustart"
                selected={startNextMonday}
                onPress={() => setStartNextMonday(true)}
              />
            )}
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <AppText variant="label" color="textSecondary">
                DEINE ANGABEN
              </AppText>
              <AppText>
                {goals.map((g) => GOAL_LABELS[g]).join(' + ')} · {level === 'einsteiger' ? 'Einsteiger' : 'Fortgeschritten'}
              </AppText>
              <AppText>{places.map((p) => PLACE_LABELS[p]).join(', ')}</AppText>
              <AppText>
                {chosenDays.map((d) => WEEKDAY_SHORT[d]).join(', ')} · {minutes} Min · {TIMES.find((t) => t.value === time)?.title}
                {doubleSessions ? ' · mit Doppel-Einheiten' : ''}
              </AppText>
              {consent ? (
                <AppText variant="caption" color="textSecondary">
                  Gesundheitsangaben werden berücksichtigt
                  {limitations.length > 0 ? `: ${limitations.map((l) => LIMITATION_LABELS[l]).join(', ')}` : ''}
                </AppText>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button title={step === 'start' ? 'Plan erstellen' : 'Weiter'} onPress={next} disabled={!canContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { gap: Spacing.three },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  topSpacer: { width: 40 },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: Radius.pill },
  body: { gap: Spacing.three, paddingBottom: Spacing.four },
  group: { gap: Spacing.two, marginTop: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  inputRow: { flexDirection: 'row', gap: Spacing.three },
  infoBox: { padding: Spacing.three, borderRadius: Radius.large, borderWidth: 1, gap: Spacing.two },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  weekDay: {
    flex: 1,
    maxWidth: 48,
    aspectRatio: 1,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteRow: { flexDirection: 'row', gap: Spacing.two },
  minute: { flex: 1, alignItems: 'center', paddingVertical: Spacing.three, borderRadius: Radius.large, borderWidth: 2 },
  secondQuestion: { marginTop: Spacing.three },
  footer: { paddingTop: Spacing.two },
});
