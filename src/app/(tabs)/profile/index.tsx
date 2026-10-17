import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useProfile } from '@/hooks/use-profile';
import { authErrorMessage } from '@/lib/logic/auth-errors';
import { signOut } from '@/lib/supabase/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    try {
      await signOut();
    } catch (e) {
      setError(authErrorMessage(e));
    }
  }

  return (
    <Screen>
      <Card>
        <AppText variant="title">{profile?.display_name || 'Dein Profil'}</AppText>
        <AppText color="textSecondary">{profile?.email}</AppText>
      </Card>

      <Button title="Datenschutz und Einwilligungen" variant="secondary" onPress={() => router.push('/profile/privacy')} />

      {error ? (
        <AppText color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button title="Abmelden" variant="ghost" onPress={handleSignOut} />
    </Screen>
  );
}
