import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';

// Platzhaltertext. Vor dem Livegang juristisch prüfen und ersetzen.
export default function TermsScreen() {
  return (
    <Screen>
      <AppText variant="title">Nutzungsbedingungen</AppText>
      <AppText color="danger" variant="label">
        PLATZHALTER – NOCH NICHT JURISTISCH GEPRÜFT
      </AppText>
      <AppText color="textSecondary">
        Hier stehen später die Nutzungsbedingungen der App. Die Trainingsinhalte ersetzen keine ärztliche Beratung.
      </AppText>
    </Screen>
  );
}
