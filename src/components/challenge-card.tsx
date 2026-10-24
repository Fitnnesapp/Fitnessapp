import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  challengeStatus,
  challengeWindow,
  daysUntil,
  formatValue,
  unitLabel,
  type Challenge,
  type ChallengeProgress,
  type JoinedChallenge,
} from '@/lib/logic/challenges';

type ChallengeCardProps = {
  challenge: Challenge;
  joined?: JoinedChallenge;
  progress?: ChallengeProgress;
  now: number;
  onPress: () => void;
};

/** Kompakte Karte: ohne Teilnahme eine Einladung, mit Teilnahme der Fortschritt. */
export function ChallengeCard({ challenge, joined, progress, now, onPress }: ChallengeCardProps) {
  const theme = useTheme();
  const status = challengeStatus(challenge, now, joined);
  const { start } = challengeWindow(challenge, joined?.joinedAt);

  let meta: string;
  if (progress?.completed) meta = 'Geschafft';
  else if (status === 'upcoming') meta = `Startet in ${daysUntil(start, now)} ${daysUntil(start, now) === 1 ? 'Tag' : 'Tagen'}`;
  else if (status === 'ended') meta = 'Beendet';
  else if (progress) meta = `Noch ${progress.daysLeft} ${progress.daysLeft === 1 ? 'Tag' : 'Tage'}`;
  else meta = challenge.tagline;

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: joined ? theme.accent : theme.accentSoft }]}>
          <Ionicons
            name={challenge.icon as ComponentProps<typeof Ionicons>['name']}
            size={24}
            color={joined ? theme.onAccent : theme.accent}
          />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">{challenge.name}</AppText>
          <AppText variant="caption" color={progress?.completed ? 'accent' : 'textSecondary'}>
            {meta}
          </AppText>
        </View>
        {joined ? (
          <AppText variant="heading" style={styles.tabular}>
            {formatValue(progress?.value ?? 0)}/{joined.target}
          </AppText>
        ) : (
          <View style={[styles.cta, { borderColor: theme.accent }]}>
            <AppText variant="label" color="accent">
              {status === 'upcoming' ? 'Vormerken' : 'Mitmachen'}
            </AppText>
          </View>
        )}
      </View>

      {joined && progress ? (
        <>
          <View style={[styles.track, { backgroundColor: theme.accentSoft }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: theme.accent, width: `${Math.max(3, Math.round(progress.ratio * 100))}%` },
              ]}
            />
          </View>
          <AppText variant="caption" color="textSecondary">
            {progress.message}
          </AppText>
        </>
      ) : (
        <AppText variant="caption" color="textSecondary" numberOfLines={2}>
          Ziel: {challenge.target} {unitLabel(challenge.metric, challenge.target)}
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 48, height: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  cta: { borderWidth: 1.5, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  track: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
