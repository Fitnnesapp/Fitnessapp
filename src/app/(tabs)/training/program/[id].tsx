import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { PremiumPrompt } from '@/components/premium-prompt';
import { getProgram, isFreeProgram } from '@/data/programs';
import { useSubscription } from '@/hooks/use-subscription';
import { exerciseCount, programMinutes } from '@/lib/logic/timeline';

export default function ProgramDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = getProgram(id);
  const { isPremium } = useSubscription();

  if (!program) {
    return (
      <Screen>
        <AppText variant="title">Programm nicht gefunden</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="label" color="accent">
        {program.category.toUpperCase()}
      </AppText>
      <AppText variant="title">{program.name}</AppText>
      <AppText color="textSecondary">{program.description}</AppText>
      <AppText>
        {programMinutes(program)} Min · {program.difficulty} · {exerciseCount(program)} Übungen
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {program.workSeconds} s Belastung, {program.restSeconds} s Pause
        {program.rounds > 1 ? `, ${program.rounds} Runden` : ''}. Du hörst Signaltöne bei jedem Wechsel.
      </AppText>

      {isPremium || isFreeProgram(program.id) ? (
        <Button
          title="Starten"
          onPress={() => router.push({ pathname: '/training/player/[id]', params: { id: program.id } })}
        />
      ) : (
        <PremiumPrompt
          title="Premium-Programm"
          text="Dieses Programm gehört zur vollen Bibliothek. Mit Premium stehen dir alle Programme offen, dazu gibt es eine kostenlose Testwoche."
        />
      )}

      <AppText variant="heading">Übungen</AppText>
      {program.steps.map((step, index) => (
        <Card key={step.name + index}>
          <AppText variant="heading">
            {index + 1}. {step.name}
          </AppText>
          <AppText color="textSecondary">{step.instruction}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
