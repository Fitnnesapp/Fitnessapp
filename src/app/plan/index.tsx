import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { dayHeading } from '@/lib/logic/motivation';
import {
  GOAL_LABELS,
  ifThenSentence,
  planDayCount,
  PLACE_LABELS,
  weekdayOf,
  WEEKDAY_NAMES,
  type PlanSession,
} from '@/lib/logic/plan';
import { hrefForSession } from '@/lib/plan-href';
import { usePlanStore } from '@/lib/storage/plan-store';

const KIND_ICON: Record<PlanSession['kind'], keyof typeof Ionicons.glyphMap> = {
  strength: 'barbell',
  program: 'body',
  run: 'walk',
};

/** Wochenplan mit Wenn-Dann-Sätzen. Jeder Tag lässt sich selbst belegen, die heutige Einheit direkt starten. */
export default function PlanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const plan = usePlanStore((state) => state.plan);
  const { neu } = useLocalSearchParams<{ neu?: string }>();

  if (!plan) {
    return (
      <Screen>
        <AppText variant="title">Noch kein Plan</AppText>
        <AppText color="textSecondary">
          Beantworte ein paar kurze Fragen, dann bekommst du einen Wochenplan, der zu deinem Ziel und deiner Zeit passt.
        </AppText>
        <Button title="Plan erstellen" onPress={() => router.push('/plan/setup')} />
      </Screen>
    );
  }

  const started = now >= plan.startsAt;
  const today = weekdayOf(now);
  const totalMinutes = plan.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const openDay = (day: number) => router.push({ pathname: '/plan/day', params: { d: String(day) } });

  return (
    <Screen>
      {neu ? (
        <View style={[styles.banner, { backgroundColor: theme.accent }]}>
          <Ionicons name="sparkles" size={22} color={theme.onAccent} />
          <AppText variant="heading" style={[styles.flex, { color: theme.onAccent }]}>
            Dein Plan steht. Der wichtigste Schritt ist geschafft.
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
                <AppText variant="label" style={{ color: isToday ? theme.onAccent : theme.text }}>
                  {name.slice(0, 2)}
                </AppText>
              </View>
              <AppText variant="caption" color={isToday ? 'accent' : 'textSecondary'} style={styles.flex}>
                {isToday ? 'HEUTE' : name.toUpperCase()}
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
            {isToday ? <Button title="Jetzt starten" onPress={() => router.push(hrefForSession(sessions[0]))} /> : null}
          </Card>
        );
      })}

      <AppText variant="caption" color="textSecondary">
        Ruhetage machen dich stärker. Wenn du eine Einheit verpasst, ist das kein Problem: Wichtig ist, dass du zur
        nächsten wiederkommst.
      </AppText>

      {neu ? <Button title="Los geht's" onPress={() => router.replace('/dashboard')} /> : null}
      <Button title="Fragen neu beantworten" variant="secondary" onPress={() => router.push('/plan/setup')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.large },
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
