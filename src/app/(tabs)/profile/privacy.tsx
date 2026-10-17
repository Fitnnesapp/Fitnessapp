import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ToggleRow } from '@/components/ui/toggle-row';
import { useProfile, useSetConsent } from '@/hooks/use-profile';
import { authErrorMessage } from '@/lib/logic/auth-errors';
import { CONSENTS } from '@/lib/logic/consent';
import { deleteOwnAccount } from '@/lib/supabase/auth';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const setConsent = useSetConsent();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    Alert.alert(
      'Konto löschen?',
      'Dein Konto und alle gespeicherten Daten werden endgültig gelöscht. Das lässt sich nicht rückgängig machen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setError(null);
            try {
              await deleteOwnAccount();
            } catch (e) {
              setError(authErrorMessage(e));
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <AppText color="textSecondary">
        Hier kannst du jede Einwilligung einzeln und jederzeit widerrufen. Jede Änderung wird mit Zeitstempel
        protokolliert.
      </AppText>

      {CONSENTS.map((consent) => (
        <ToggleRow
          key={consent.key}
          title={consent.title}
          description={consent.summary}
          value={profile?.[consent.key] ?? false}
          disabled={!profile || setConsent.isPending}
          onValueChange={(granted) => setConsent.mutate({ key: consent.key, granted })}
        />
      ))}

      {setConsent.isError ? (
        <AppText color="danger" accessibilityRole="alert">
          {authErrorMessage(setConsent.error)}
        </AppText>
      ) : null}

      <Button title="Datenschutzerklärung lesen" variant="secondary" onPress={() => router.push('/legal/privacy')} />

      <AppText variant="heading">Konto löschen</AppText>
      <AppText color="textSecondary">Löscht dein Konto samt aller Trainings- und Profildaten (Art. 17 DSGVO).</AppText>
      {error ? (
        <AppText color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button title="Konto endgültig löschen" variant="danger" loading={deleting} onPress={confirmDelete} />
    </Screen>
  );
}
