import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { dayHeading } from '@/lib/logic/motivation';
import { GOAL_LABELS, ifThenSentence, weekdayOf, WEEKDAY_NAMES, type PlanSession } from '@/lib/logic/plan';
import { hrefForSession } from '@/lib/plan-href';
import { usePlanStore } from '@/lib/storage/plan-store';

const KIND_ICON: Record<PlanSession['kind'], keyof typeof Ionicons.glyphMap> = {
  strength: 'barbell',
  program: 'body',
  run: 'walk',
};

/** Wochenplan mit Wenn-Dann-Sätzen. Die heutige Einheit lässt sich direkt starten. */
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
          {GOAL_LABELS[plan.answers.goal].toUpperCase()}
        </AppText>
        <AppText variant="title">
          {plan.sessions.length} Einheiten pro Woche, zusammen etwa {totalMinutes} Minuten
        </AppText>
        {started ? null : (
          <AppText color="textSecondary">Start: {dayHeading(plan.startsAt)}. Bis dahin darfst du gern schon reinschnuppern.</AppText>
        )}
      </View>

      {plan.sessions.map((session) => {
        const isToday = started && session.day === today;
        return (
          <Card key={session.day} style={isToday ? { borderColor: theme.accent, borderWidth: 2 } : undefined}>
            <View style={styles.row}>
              <View style={[styles.dayBadge, { backgroundColor: isToday ? theme.accent : theme.surfaceAlt }]}>
                <AppText variant="label" style={{ color: isToday ? theme.onAccent : theme.text }}>
                  {WEEKDAY_NAMES[session.day].slice(0, 2)}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="caption" color={isToday ? 'accent' : 'textSecondary'}>
                  {isToday ? 'HEUTE' : WEEKDAY_NAMES[session.day].toUpperCase()} · {session.minutes} MIN
                </AppText>
                <AppText variant="heading">{session.title}</AppText>
              </View>
              <Ionicons name={KIND_ICON[session.kind]} size={22} color={theme.accent} />
            </View>
            <AppText color="textSecondary">{session.detail}</AppText>
            <View style={[styles.ifThen, { backgroundColor: theme.surfaceAlt }]}>
              <AppText variant="caption">{ifThenSentence(session, plan.answers.time)}</AppText>
            </View>
            {isToday ? <Button title="Jetzt starten" onPress={() => router.push(hrefForSession(session))} /> : null}
          </Card>
        );
      })}

      <AppText variant="caption" color="textSecondary">
        Die Tage ohne Einheit sind Ruhetage. Erholung macht dich stärker. Wenn du eine Einheit verpasst, ist das kein
        Problem: Wichtig ist, dass du zur nächsten wiederkommst.
      </AppText>

      {neu ? <Button title="Los geht's" onPress={() => router.replace('/dashboard')} /> : null}
      <Button title="Plan neu erstellen" variant="secondary" onPress={() => router.push('/plan/setup')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.large },
  headerBlock: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dayBadge: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  ifThen: { padding: Spacing.three, borderRadius: Radius.medium },
});
