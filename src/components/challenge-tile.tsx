import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ImageCard } from '@/components/ui/image-card';
import { Radius, Spacing } from '@/constants/theme';
import { sceneForChallenge } from '@/data/images';
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

type ChallengeTileProps = {
  challenge: Challenge;
  joined?: JoinedChallenge;
  progress?: ChallengeProgress;
  now: number;
  width: number;
  onPress: () => void;
};

/** Hochformatige Bildkachel für das Challenge-Karussell. */
export function ChallengeTile({ challenge, joined, progress, now, width, onPress }: ChallengeTileProps) {
  const theme = useTheme();
  const status = challengeStatus(challenge, now, joined);
  const { start } = challengeWindow(challenge, joined?.joinedAt);
  const startsIn = daysUntil(start, now);

  const badge = progress?.completed
    ? 'GESCHAFFT'
    : joined
      ? 'DABEI'
      : status === 'upcoming'
        ? `IN ${startsIn} ${startsIn === 1 ? 'TAG' : 'TAGEN'}`
        : 'LÄUFT';

  return (
    <ImageCard
      source={sceneForChallenge(challenge.id)}
      height={340}
      style={{ width }}
      accessibilityLabel={`${challenge.name}, ${challenge.tagline}`}
      onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: joined ? theme.accent : 'rgba(255,255,255,0.18)' }]}>
        <AppText variant="label" style={{ color: joined ? '#0B0D10' : '#FFFFFF' }}>
          {badge}
        </AppText>
      </View>
      <AppText variant="title" style={styles.onImage} numberOfLines={2}>
        {challenge.name}
      </AppText>
      <AppText variant="caption" style={styles.onImageSoft}>
        {challenge.tagline}
      </AppText>
      {joined && progress ? (
        <View style={styles.progress}>
          <View style={styles.track}>
            <View style={[styles.fill, { backgroundColor: theme.accent, width: `${Math.max(3, Math.round(progress.ratio * 100))}%` }]} />
          </View>
          <AppText variant="label" style={styles.onImage}>
            {formatValue(progress.value)}/{joined.target}
          </AppText>
        </View>
      ) : (
        <AppText variant="label" style={{ color: theme.accent }}>
          Ziel: {challenge.target} {unitLabel(challenge.metric, challenge.target)}
        </AppText>
      )}
    </ImageCard>
  );
}

const styles = StyleSheet.create({
  onImage: { color: '#FFFFFF' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.pill },
  progress: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  track: { flex: 1, height: 8, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
