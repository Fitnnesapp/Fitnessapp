import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { OptionCard } from '@/components/ui/option-card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { FREE_PROGRAM_IDS, PROGRAMS } from '@/data/programs';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import {
  buildPlan,
  GOAL_LABELS,
  recommendedDayCount,
  recommendedDays,
  weekdayOf,
  WEEKDAY_SHORT,
  type PlanGoal,
  type PlanLevel,
  type PlanPlace,
  type PlanTime,
} from '@/lib/logic/plan';
import { usePlanStore } from '@/lib/storage/plan-store';

type IconName = ComponentProps<typeof Ionicons>['name'];

const GOALS: { value: PlanGoal; hint: string; icon: IconName }[] = [
  { value: 'muskeln', hint: 'Stärker werden und Muskeln aufbauen', icon: 'barbell' },
  { value: 'fitness', hint: 'Abwechslungsreich in Form bleiben', icon: 'heart' },
  { value: 'abnehmen', hint: 'Kraft und Ausdauer kombiniert', icon: 'flame' },
  { value: 'ausdauer', hint: 'Schneller und weiter laufen', icon: 'walk' },
];

const LEVELS: { value: PlanLevel; title: string; hint: string; icon: IconName }[] = [
  { value: 'einsteiger', title: 'Einsteiger', hint: 'Neu dabei oder länger raus', icon: 'leaf' },
  { value: 'fortgeschritten', title: 'Fortgeschritten', hint: 'Trainiere seit Monaten regelmäßig', icon: 'trending-up' },
];

const PLACES: { value: PlanPlace; title: string; hint: string; icon: IconName }[] = [
  { value: 'studio', title: 'Im Fitnessstudio', hint: 'Mit Hanteln und Geräten', icon: 'business' },
  { value: 'zuhause', title: 'Zu Hause', hint: 'Ohne Geräte', icon: 'home' },
  { value: 'beides', title: 'Beides', hint: 'Studio und zu Hause', icon: 'swap-horizontal' },
];

const MINUTES = [20, 30, 45, 60];

const TIMES: { value: PlanTime; title: string; icon: IconName }[] = [
  { value: 'morgens', title: 'Morgens', icon: 'sunny' },
  { value: 'mittags', title: 'Mittags', icon: 'partly-sunny' },
  { value: 'abends', title: 'Abends', icon: 'moon' },
];

const STEP_COUNT = 6;

/**
 * Einstieg mit wenigen, klaren Fragen. Gestaltung nach Studien:
 * - höchstens vier Antworten pro Frage und eine markierte Empfehlung, damit die Wahl leicht fällt
 * - Fortschrittsbalken, der beim Öffnen schon einen Abschnitt zeigt (Endowed-Progress-Effekt,
 *   Nunes & Drèze 2006): Menschen schließen eher ab, wenn sie sich schon unterwegs sehen
 * - Tag und Tageszeit werden festgelegt, daraus entstehen Wenn-Dann-Pläne (Gollwitzer & Sheeran 2006)
 * - Start am Montag als bewusster Neuanfang (Neustart-Effekt, Dai, Milkman & Riis 2014)
 */
export default function PlanSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const { isPremium } = useSubscription();
  const setPlan = usePlanStore((state) => state.setPlan);
  const skip = usePlanStore((state) => state.skipOnboarding);
  const hasPlan = usePlanStore((state) => state.plan !== null);

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<PlanGoal | null>(null);
  const [level, setLevel] = useState<PlanLevel | null>(null);
  const [place, setPlace] = useState<PlanPlace | null>(null);
  const [days, setDays] = useState<number[] | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [time, setTime] = useState<PlanTime>('abends');
  const [startNextMonday, setStartNextMonday] = useState(false);

  const recommendedCount = goal && level ? recommendedDayCount(goal, level) : 3;
  const chosenDays = days ?? recommendedDays(recommendedCount);
  const isMonday = weekdayOf(now) === 0;

  const canContinue = useMemo(() => {
    if (step === 0) return goal !== null;
    if (step === 1) return level !== null;
    if (step === 2) return place !== null;
    if (step === 3) return chosenDays.length > 0;
    return true;
  }, [step, goal, level, place, chosenDays.length]);

  function finish() {
    if (!goal || !level || !place) return;
    const plan = buildPlan(
      { goal, level, place, days: chosenDays, minutes, time },
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
    if (step < STEP_COUNT - 1) setStep(step + 1);
    else finish();
  }

  function leave() {
    skip();
    if (router.canGoBack()) router.back();
    else router.replace('/dashboard');
  }

  function toggleDay(day: number) {
    const set = new Set(chosenDays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    setDays([...set].sort((a, b) => a - b));
  }

  return (
    <Screen topInset scroll={false} contentStyle={styles.screen}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 0 ? 'Schließen' : 'Zurück'}
          onPress={step === 0 ? leave : () => setStep(step - 1)}
          hitSlop={12}>
          <Ionicons name={step === 0 ? 'close' : 'chevron-back'} size={26} color={theme.text} />
        </Pressable>
        {/* Ein Abschnitt mehr als Fragen: der erste ist mit dem Öffnen schon geschafft */}
        <View style={styles.segments} accessibilityLabel={`Schritt ${step + 1} von ${STEP_COUNT}`}>
          {Array.from({ length: STEP_COUNT + 1 }, (_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: i <= step ? theme.accent : theme.surfaceAlt }]} />
          ))}
        </View>
        {step === 0 && !hasPlan ? (
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
        {step === 0 ? (
          <>
            <AppText variant="label" color="accent">
              DEIN PERSÖNLICHER PLAN · 1 MINUTE
            </AppText>
            <AppText variant="title">Was möchtest du erreichen?</AppText>
            {GOALS.map((g) => (
              <OptionCard
                key={g.value}
                title={GOAL_LABELS[g.value]}
                hint={g.hint}
                icon={g.icon}
                selected={goal === g.value}
                onPress={() => {
                  setGoal(g.value);
                  setDays(null);
                }}
              />
            ))}
          </>
        ) : null}

        {step === 1 ? (
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

        {step === 2 ? (
          <>
            <AppText variant="title">Wo trainierst du?</AppText>
            {PLACES.map((p) => (
              <OptionCard
                key={p.value}
                title={p.title}
                hint={p.hint}
                icon={p.icon}
                selected={place === p.value}
                onPress={() => setPlace(p.value)}
              />
            ))}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <AppText variant="title">An welchen Tagen trainierst du?</AppText>
            <AppText color="textSecondary">
              Empfohlen sind {recommendedCount} Tage mit Pausen dazwischen. Erholung gehört zum Training, und ein Plan,
              den du durchhältst, schlägt einen perfekten.
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
                    onPress={() => toggleDay(day)}
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
          </>
        ) : null}

        {step === 4 ? (
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
                    {
                      backgroundColor: minutes === m ? theme.accent : theme.surface,
                      borderColor: minutes === m ? theme.accent : theme.border,
                    },
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

        {step === 5 ? (
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
            <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <AppText variant="label" color="textSecondary">
                DEINE ANGABEN
              </AppText>
              <AppText>
                {goal ? GOAL_LABELS[goal] : ''} · {level === 'einsteiger' ? 'Einsteiger' : 'Fortgeschritten'} ·{' '}
                {PLACES.find((p) => p.value === place)?.title}
              </AppText>
              <AppText>
                {chosenDays.map((d) => WEEKDAY_SHORT[d]).join(', ')} · {minutes} Min ·{' '}
                {TIMES.find((t) => t.value === time)?.title}
              </AppText>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={step === STEP_COUNT - 1 ? 'Plan erstellen' : 'Weiter'}
          onPress={next}
          disabled={!canContinue}
        />
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
  summary: { padding: Spacing.three, borderRadius: Radius.large, borderWidth: 1, gap: Spacing.one, marginTop: Spacing.two },
  footer: { paddingTop: Spacing.two },
});
