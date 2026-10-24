import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { ChallengeTile } from '@/components/challenge-tile';
import { EventCard } from '@/components/event-card';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
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
  const { width } = useWindowDimensions();
  // Kachel so breit, dass die nächste angeschnitten sichtbar bleibt und zum Wischen einlädt
  const tileWidth = Math.min(300, Math.round(width * 0.72));

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={tileWidth + Spacing.three}
        decelerationRate="fast"
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}>
        {entries.map((entry) => (
          <ChallengeTile
            key={entry.challenge.id}
            challenge={entry.challenge}
            joined={entry.joined}
            progress={entry.progress}
            now={now}
            width={tileWidth}
            onPress={() => router.push({ pathname: '/discover/challenge/[id]', params: { id: entry.challenge.id } })}
          />
        ))}
      </ScrollView>

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

const styles = StyleSheet.create({
  // Karussell bis an den Bildschirmrand, Inhalt mit dem normalen Seitenabstand
  carousel: { marginHorizontal: -Spacing.four },
  carouselContent: { paddingHorizontal: Spacing.four, gap: Spacing.three },
});
