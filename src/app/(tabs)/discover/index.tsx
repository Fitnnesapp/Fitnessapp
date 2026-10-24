import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { ChallengeCard } from '@/components/challenge-card';
import { EventCard } from '@/components/event-card';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { useChallenges } from '@/hooks/use-challenges';
import { upcomingEvents } from '@/lib/logic/events';
import { useEvents, useEventsStore } from '@/lib/storage/events-store';

/** Challenges zum Mitmachen und angekündigte Events. */
export default function DiscoverScreen() {
  const router = useRouter();
  const { entries, now } = useChallenges();
  const events = useEvents();
  const refresh = useEventsStore((state) => state.refresh);
  const upcoming = useMemo(() => upcomingEvents(events, now, 20), [events, now]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

      <AppText variant="heading">Events</AppText>
      <AppText variant="caption" color="textSecondary">
        Große Läufe und Fitness-Wettkämpfe. Ein festes Datum vor Augen hilft beim Dranbleiben. Anmeldung beim
        Veranstalter.
      </AppText>
      {upcoming.length === 0 ? (
        <AppText color="textSecondary">Gerade sind keine Events angekündigt.</AppText>
      ) : (
        upcoming.map((event) => <EventCard key={event.id} event={event} now={now} />)
      )}
    </Screen>
  );
}
