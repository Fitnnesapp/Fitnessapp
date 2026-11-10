import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/ui/icon-badge';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageCard } from '@/components/ui/image-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { OnImage, Radius, Spacing } from '@/constants/theme';
import { SCENES } from '@/data/images';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { getProgram } from '@/data/programs';
import { planWeeklyBenefit, WHO_AEROBIC_MINUTES, WHO_STRENGTH_DAYS } from '@/lib/logic/health-benefit';
import { dayHeading } from '@/lib/logic/motivation';
import {
  GOAL_LABELS,
  ifThenSentence,
  planDayCount,
  planWeekProgress,
  PLACE_LABELS,
  weekdayOf,
  WEEKDAY_NAMES,
  type PlanSession,
} from '@/lib/logic/plan';
import { confirmAction } from '@/lib/confirm';
import { hrefForSession } from '@/lib/plan-href';
import { usePlanStore } from '@/lib/storage/plan-store';

const KIND_ICON: Record<PlanSession['kind'], keyof typeof Ionicons.glyphMap> = {
  strength: 'barbell',
  program: 'body',
  run: 'walk',
  ride: 'bicycle',
};

/** Wochenplan mit Wenn-Dann-Sätzen. Jeder Tag lässt sich selbst belegen, die heutige Einheit direkt starten. */
export default function PlanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const plan = usePlanStore((state) => state.plan);
  const clearPlan = usePlanStore((state) => state.clearPlan);
  const activities = useActivities();
  const { neu } = useLocalSearchParams<{ neu?: string }>();

  if (!plan) {
    return (
      <Screen>
        <ImageCard
          source={SCENES['goal-fitness']}
          height={280}
          onPress={() => router.push('/plan/setup')}
          accessibilityLabel="Plan erstellen">
          <AppText variant="eyebrow" style={{ color: OnImage.accent }}>
            IN EINER MINUTE
          </AppText>
          <AppText variant="display" style={styles.emptyTitle}>
            Dein eigener Wochenplan
          </AppText>
          <AppText style={styles.emptyText}>
            Ein paar kurze Fragen zu Ziel, Orten, Tagen und Zeit. Daraus entsteht ein Plan mit festen Tagen, den du
            jederzeit anpassen kannst.
          </AppText>
        </ImageCard>
        <Button title="Plan erstellen" onPress={() => router.push('/plan/setup')} />
        <AppText variant="caption" color="textSecondary">
          Feste Tage und Uhrzeiten („Wenn es Dienstag 18 Uhr ist, dann trainiere ich“) erhöhen in Studien deutlich, wie
          oft Vorsätze umgesetzt werden (Gollwitzer & Sheeran 2006). Deine Angaben bleiben auf diesem Gerät.
        </AppText>
      </Screen>
    );
  }

  const started = now >= plan.startsAt;
  const today = weekdayOf(now);
  const totalMinutes = plan.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const week = planWeekProgress(plan, activities, now);
  const openDay = (day: number) => router.push({ pathname: '/plan/day', params: { d: String(day) } });

  return (
    <Screen>
      {neu ? (
        <View style={styles.celebrate}>
          <IconBadge icon="checkmark" size={96} />
          <AppText variant="title" style={styles.center}>
            Dein Plan steht.
          </AppText>
          <AppText color="textSecondary" style={styles.center}>
            Der wichtigste Schritt ist geschafft. Ab jetzt weißt du jeden Tag, was dran ist.
          </AppText>
        </View>
      ) : null}

      <View style={styles.headerBlock}>
        <AppText variant="label" color="accent">
          {plan.answers.goals.map((g) => GOAL_LABELS[g]).join(' + ').toUpperCase()}
        </AppText>
        <AppText variant="title">
          {planDayCount(plan)} Trainingstage pro Woche, zusammen etwa {totalMinutes} Minuten
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {plan.answers.places.map((p) => PLACE_LABELS[p]).join(' · ')}
        </AppText>
        {started ? null : (
          <AppText color="textSecondary">Start: {dayHeading(plan.startsAt)}. Bis dahin darfst du gern schon reinschnuppern.</AppText>
        )}
      </View>

      {started && week.planned > 0 ? (
        <Card>
          <AppText variant="label" color="textSecondary">
            DIESE WOCHE
          </AppText>
          <AppText variant="title">
            {week.done} <AppText color="textSecondary">von {week.planned} geplanten Tagen</AppText>
          </AppText>
          <ProgressBar progress={week.done / week.planned} />
          <AppText variant="caption" color={week.done >= week.planned ? 'accent' : 'textSecondary'}>
            {week.done >= week.planned
              ? 'Alle geplanten Tage dieser Woche geschafft.'
              : week.done === 0
                ? 'Ein Tag zählt, sobald du an ihm trainiert hast, egal welche Einheit.'
                : 'Jeder erledigte Tag zählt. Der nächste steht unten.'}
          </AppText>
        </Card>
      ) : null}

      {/* Nutzen des Plans: was er nach WHO bringt, wenn man ihn wie geplant trainiert */}
      {(() => {
        const benefit = planWeeklyBenefit(
          plan.sessions.map((session) => ({
            day: session.day,
            kind: session.kind,
            minutes: session.minutes,
            category: session.programId ? getProgram(session.programId)?.category : undefined,
          })),
        );
        const both = benefit.aerobicMet && benefit.strengthMet;
        return (
          <Card>
            <View style={styles.row}>
              <Ionicons name={both ? 'heart' : 'heart-outline'} size={20} color={theme.accent} />
              <AppText variant="heading">Was dir dieser Plan bringt</AppText>
            </View>
            <AppText color="textSecondary">
              Etwa {benefit.aerobicMinutes} von {WHO_AEROBIC_MINUTES} Ausdauerminuten und {benefit.strengthDays} von{' '}
              {WHO_STRENGTH_DAYS} Krafttagen der WHO-Empfehlung pro Woche.
            </AppText>
            <AppText color={both ? 'accent' : 'text'}>
              {both
                ? 'Wie geplant trainiert, erfüllst du beide Empfehlungen: das Pensum, das in großen Studien am stärksten mit einem längeren, gesünderen Leben zusammenhängt.'
                : benefit.strengthMet
                  ? 'Für die volle Empfehlung fehlt Ausdauer: Ein zusätzlicher lockerer Lauf oder eine Radtour an einem Ruhetag schließt die Lücke.'
                  : benefit.aerobicMet
                    ? 'Für die volle Empfehlung fehlt Kraft: Belege einen Ruhetag mit einem kurzen Kraft- oder Ganzkörper-Workout.'
                    : 'Ein guter Anfang. Mit einer weiteren Einheit pro Woche kommst du der WHO-Empfehlung deutlich näher.'}
            </AppText>
          </Card>
        );
      })()}

      {plan.notes.length > 0 ? (
        <Card style={{ borderColor: theme.accent }}>
          <View style={styles.row}>
            <Ionicons name="medkit" size={20} color={theme.accent} />
            <AppText variant="heading">Auf dich abgestimmt</AppText>
          </View>
          {plan.notes.map((note) => (
            <AppText key={note} variant="caption" color="textSecondary">
              {note}
            </AppText>
          ))}
        </Card>
      ) : null}

      {WEEKDAY_NAMES.map((name, day) => {
        const sessions = plan.sessions.filter((s) => s.day === day);
        const isToday = started && day === today;
        const isDone = started && week.doneDays[day];

        if (sessions.length === 0) {
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`${name}: Ruhetag. Tippen zum Belegen.`}
              onPress={() => openDay(day)}
              style={[styles.restRow, { borderColor: theme.border }]}>
              <AppText variant="label" color="textSecondary" style={styles.restDay}>
                {name.slice(0, 2).toUpperCase()}
              </AppText>
              <AppText color="textSecondary" style={styles.flex}>
                Ruhetag
              </AppText>
              <Ionicons name="add-circle-outline" size={20} color={theme.textSecondary} />
            </Pressable>
          );
        }

        return (
          <Card key={name} style={isToday ? { borderColor: theme.accent, borderWidth: 2 } : undefined}>
            <View style={styles.row}>
              <View style={[styles.dayBadge, { backgroundColor: isToday ? theme.accent : theme.surfaceAlt }]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={22} color={isToday ? theme.onAccent : theme.accent} />
                ) : (
                  <AppText variant="label" style={{ color: isToday ? theme.onAccent : theme.text }}>
                    {name.slice(0, 2)}
                  </AppText>
                )}
              </View>
              <AppText variant="caption" color={isToday || isDone ? 'accent' : 'textSecondary'} style={styles.flex}>
                {isToday ? (isDone ? 'HEUTE · ERLEDIGT' : 'HEUTE') : isDone ? `${name.toUpperCase()} · ERLEDIGT` : name.toUpperCase()}
                {sessions.length > 1 ? ' · 2 EINHEITEN' : ''}
              </AppText>
              <Pressable accessibilityRole="button" accessibilityLabel={`${name} bearbeiten`} onPress={() => openDay(day)} hitSlop={10}>
                <AppText variant="label" color="accent">
                  Ändern
                </AppText>
              </Pressable>
            </View>

            {sessions.map((session) => (
              <View key={session.id} style={styles.session}>
                <View style={styles.row}>
                  <Ionicons name={KIND_ICON[session.kind]} size={20} color={theme.accent} />
                  <AppText variant="heading" style={styles.flex}>
                    {session.title}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {session.minutes} Min
                  </AppText>
                </View>
                <AppText variant="caption" color="textSecondary">
                  {session.detail}
                </AppText>
              </View>
            ))}

            <View style={[styles.ifThen, { backgroundColor: theme.surfaceAlt }]}>
              <AppText variant="caption">{ifThenSentence(sessions[0], plan.answers.time)}</AppText>
            </View>
            {isToday ? (
              <Button
                title={isDone ? 'Noch eine Einheit starten' : 'Jetzt starten'}
                variant={isDone ? 'secondary' : 'primary'}
                onPress={() => router.push(hrefForSession(sessions[0], plan.answers))}
              />
            ) : null}
          </Card>
        );
      })}

      <AppText variant="caption" color="textSecondary">
        Ruhetage machen dich stärker. Wenn du eine Einheit verpasst, ist das kein Problem: Wichtig ist, dass du zur
        nächsten wiederkommst.
      </AppText>

      {neu ? <Button title="Los geht's" onPress={() => router.replace('/dashboard')} /> : null}
      <Button title="Fragen neu beantworten" variant="secondary" onPress={() => router.push('/plan/setup')} />
      <Button
        title="Plan beenden"
        variant="ghost"
        onPress={() =>
          confirmAction({
            title: 'Plan beenden?',
            message:
              'Dein Wochenplan wird entfernt. Workouts, Serie und Abzeichen bleiben erhalten. Du kannst jederzeit einen neuen Plan erstellen.',
            confirmLabel: 'Beenden',
            onConfirm: () => {
              clearPlan();
              router.replace('/dashboard');
            },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 36, fontWeight: '900' },
  emptyText: { color: '#FFFFFF', opacity: 0.85 },
  flex: { flex: 1 },
  celebrate: { alignItems: 'center', gap: Spacing.two },
  center: { textAlign: 'center' },
  headerBlock: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dayBadge: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  session: { gap: Spacing.one, paddingTop: Spacing.one },
  ifThen: { padding: Spacing.three, borderRadius: Radius.medium },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  restDay: { width: 40, textAlign: 'center' },
});
