import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ChallengeArt, artVariantFor } from '@/components/illustrations/challenge-art';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { getChallenge } from '@/data/challenges';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import {
  challengeProgress,
  challengeStatus,
  challengeWindow,
  daysUntil,
  formatValue,
  targetOnJoin,
  unitLabel,
} from '@/lib/logic/challenges';
import { useChallengeStore } from '@/lib/storage/challenge-store';

/** Einzelne Challenge: Beschreibung, Fortschritts-Ring, Etappen und Teilnahme. */
export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const now = useNow(60_000);
  const activities = useActivities();
  const challenge = getChallenge(id);
  const joined = useChallengeStore((state) => (id ? state.joined[id] : undefined));
  const join = useChallengeStore((state) => state.join);
  const leave = useChallengeStore((state) => state.leave);

  if (!challenge) {
    return (
      <Screen>
        <AppText>Diese Challenge gibt es nicht mehr.</AppText>
        <Button title="Zurück" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const status = challengeStatus(challenge, now, joined);
  const progress = joined ? challengeProgress(challenge, joined, activities, now) : null;
  const { start } = challengeWindow(challenge, joined?.joinedAt);
  const unit = unitLabel(challenge.metric, joined?.target ?? challenge.target);
  const preview = joined ? null : targetOnJoin(challenge, activities, now);
  const lateJoin = preview !== null && preview < challenge.target;

  function onJoin() {
    if (!challenge) return;
    join(challenge.id, { joinedAt: now, target: targetOnJoin(challenge, activities, now) });
  }

  function onLeave() {
    if (!challenge) return;
    confirmAction({
      title: 'Challenge verlassen?',
      message: 'Deine Workouts bleiben erhalten. Du kannst später wieder beitreten.',
      confirmLabel: 'Verlassen',
      onConfirm: () => leave(challenge.id),
    });
  }

  return (
    <Screen>
      <ChallengeArt variant={artVariantFor(challenge.id)} height={180} />
      <View style={styles.head}>
        <AppText variant="label" color="accent">
          {challenge.tagline.toUpperCase()}
        </AppText>
        <AppText variant="title" style={styles.center}>
          {challenge.name}
        </AppText>
      </View>

      {progress && joined ? (
        <Card style={styles.progressCard}>
          <ProgressRing progress={progress.ratio} size={168} strokeWidth={16}>
            <AppText variant="display" style={styles.tabular}>
              {formatValue(progress.value)}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              von {joined.target} {unit}
            </AppText>
          </ProgressRing>
          <AppText variant="heading" style={styles.center}>
            {progress.message}
          </AppText>
          {status === 'active' && !progress.completed ? (
            <AppText variant="caption" color="textSecondary">
              Noch {progress.daysLeft} {progress.daysLeft === 1 ? 'Tag' : 'Tage'}
            </AppText>
          ) : null}
          {status === 'upcoming' ? (
            <AppText variant="caption" color="textSecondary">
              Startet in {daysUntil(start, now)} {daysUntil(start, now) === 1 ? 'Tag' : 'Tagen'}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <AppText variant="label" color="textSecondary">
          ETAPPEN
        </AppText>
        {challenge.stages.map((stage, i) => {
          const reached = (progress?.stage ?? -1) >= i;
          const target = joined?.target ?? challenge.target;
          const at = Math.ceil((target * (i + 1)) / 4);
          return (
            <View key={stage} style={styles.stageRow}>
              <View
                style={[
                  styles.stageDot,
                  { backgroundColor: reached ? theme.accent : 'transparent', borderColor: reached ? theme.accent : theme.border },
                ]}>
                {reached ? <Ionicons name="checkmark" size={16} color={theme.onAccent} /> : null}
              </View>
              <AppText variant="heading" style={[styles.flex, !reached && { color: theme.textSecondary }]}>
                {stage}
              </AppText>
              <AppText variant="caption" color="textSecondary" style={styles.tabular}>
                {at} {unitLabel(challenge.metric, at)}
              </AppText>
            </View>
          );
        })}
      </Card>

      <AppText color="textSecondary">{challenge.description}</AppText>

      {joined ? (
        <Button title="Challenge verlassen" variant="ghost" onPress={onLeave} />
      ) : status === 'ended' ? (
        <AppText color="textSecondary">Diese Challenge ist beendet.</AppText>
      ) : (
        <>
          {lateJoin ? (
            <AppText variant="caption" color="textSecondary">
              Du steigst später ein, deshalb ist dein Ziel {preview} {unitLabel(challenge.metric, preview ?? 0)}. Workouts
              seit dem Start zählen schon mit.
            </AppText>
          ) : null}
          <Button title={status === 'upcoming' ? 'Vormerken und dabei sein' : 'Jetzt mitmachen'} onPress={onJoin} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  head: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.two },
  progressCard: { alignItems: 'center', gap: Spacing.three },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  stageDot: { width: 28, height: 28, borderRadius: Radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
