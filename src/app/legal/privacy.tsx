import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';

// Platzhaltertext. Vor dem Livegang juristisch prüfen und ersetzen (siehe claude-code-plan.md, Abschnitt 2).
export default function PrivacyScreen() {
  return (
    <Screen>
      <AppText variant="title">Datenschutzerklärung</AppText>
      <AppText color="danger" variant="label">
        PLATZHALTER – NOCH NICHT JURISTISCH GEPRÜFT
      </AppText>
      <AppText variant="heading">Welche Daten wir verarbeiten</AppText>
      <AppText color="textSecondary">
        Kontodaten (E-Mail, Name), Trainingsdaten, Körperdaten sowie bei Lauftracking Standortdaten. Gesundheits- und
        Standortdaten verarbeiten wir nur mit deiner ausdrücklichen, getrennt erteilten Einwilligung.
      </AppText>
      <AppText variant="heading">Deine Rechte</AppText>
      <AppText color="textSecondary">
        Du kannst Einwilligungen jederzeit im Profil widerrufen und dein Konto samt aller Daten selbst löschen.
      </AppText>
      <AppText variant="heading">Speicherort</AppText>
      <AppText color="textSecondary">Die Daten liegen in einer Datenbank in der EU-Region.</AppText>
    </Screen>
  );
}
