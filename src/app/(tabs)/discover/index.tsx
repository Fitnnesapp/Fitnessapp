import { useRouter } from 'expo-router';

import { ChallengeCard } from '@/components/challenge-card';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { useChallenges } from '@/hooks/use-challenges';

/** Challenges zum Mitmachen und angekündigte Events. */
export default function DiscoverScreen() {
  const router = useRouter();
  const { entries, now } = useChallenges();

  return (
    <Screen topInset>
      <AppText variant="title">Entdecken</AppText>

      <AppText variant="heading">Challenges</AppText>
      <AppText variant="caption" color="textSecondary">
        Zeitlich begrenzte Ziele mit Etappen. Dein Fortschritt kommt automatisch aus deinen Workouts.
      </AppText>
      {entries.map((entry) => (
        <ChallengeCard
          key={entry.challenge.id}
          challenge={entry.challenge}
          joined={entry.joined}
          progress={entry.progress}
          now={now}
          onPress={() => router.push({ pathname: '/discover/challenge/[id]', params: { id: entry.challenge.id } })}
        />
      ))}
    </Screen>
  );
}
