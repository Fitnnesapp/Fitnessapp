import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CelebrationCard } from '@/components/celebration-card';
import { DetailHeader, StatGrid } from '@/components/detail-layout';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getProgram } from '@/data/programs';
import { confirmAction } from '@/lib/confirm';
import { formatClock } from '@/lib/logic/format';
import { useHomeSessions } from '@/lib/storage/home-store';

type HomeSessionDetailProps = {
  sessionId: string | undefined;
  justFinished?: boolean;
};

const EFFORT_LEVELS = Array.from({ length: 10 }, (_, i) => i + 1);

/** Zusammenfassung eines abgeschlossenen Home-Workouts. */
export function HomeSessionDetail({ sessionId, justFinished = false }: HomeSessionDetailProps) {
  const router = useRouter();
  const { sessions, setEffort, deleteSession } = useHomeSessions();
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <Screen>
        <AppText variant="title">Workout nicht gefunden</AppText>
      </Screen>
    );
  }

  const program = getProgram(session.programId);

  function confirmDelete() {
    confirmAction({
      title: 'Workout löschen?',
      message: 'Das Workout wird aus dem Verlauf entfernt.',
      confirmLabel: 'Löschen',
      onConfirm: () => {
        deleteSession(session!.id);
        router.back();
      },
    });
  }

  return (
    <Screen>
      {justFinished ? (
        <CelebrationCard sessionId={session.id} headline={session.completed ? 'Geschafft!' : 'Gut, dass du dran warst.'} />
      ) : null}
      <DetailHeader
        startedAt={session.startedAt}
        title="Home-Workout"
        subtitle={`${program?.name ?? 'Programm'}${program ? ` · ${program.category}` : ''}${!session.completed ? ' · vorzeitig beendet' : ''}`}
      />

      <StatGrid
        items={[
          { label: 'Dauer', value: formatClock(session.activeSeconds * 1000), unit: 'Min' },
          { label: 'Kalorien (ca.)', value: String(session.caloriesEstimate), unit: 'kcal' },
        ]}
      />

      <Card>
        <AppText variant="heading">Wie anstrengend war es?</AppText>
        <AppText variant="caption" color="textSecondary">
          1 ist sehr leicht, 10 ist maximale Anstrengung. Optional.
        </AppText>
        <View style={styles.efforts}>
          {EFFORT_LEVELS.map((level) => (
            <Chip
              key={level}
              label={String(level)}
              selected={session.effort === level}
              onPress={() => setEffort(session.id, session.effort === level ? null : level)}
            />
          ))}
        </View>
      </Card>

      <AppText variant="caption" color="textSecondary">
        Die Kalorien sind eine grobe Schätzung aus Dauer, Trainingsart und Körpergewicht (im Profil einstellbar).
      </AppText>

      {justFinished ? <Button title="Fertig" onPress={() => router.replace('/training/home')} /> : null}
      <Button title="Workout löschen" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  efforts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
});
