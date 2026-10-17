import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

type ComingSoonProps = {
  title: string;
  description: string;
  phase: string;
};

/** Platzhalter für Screens, die in späteren Phasen des Plans gefüllt werden. */
export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <Screen>
      <AppText variant="title">{title}</AppText>
      <Card>
        <AppText variant="label" color="accent">
          {phase.toUpperCase()}
        </AppText>
        <AppText color="textSecondary">{description}</AppText>
      </Card>
    </Screen>
  );
}
