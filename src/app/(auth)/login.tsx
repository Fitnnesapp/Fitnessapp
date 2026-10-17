import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SocialSignIn } from '@/components/social-sign-in';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { authErrorMessage, isValidEmail } from '@/lib/logic/auth-errors';
import { signInWithEmail } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!isValidEmail(email) || password.length === 0) {
      setError('Bitte gib E-Mail und Passwort ein.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen topInset contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="display">Willkommen zurück.</AppText>
        <AppText color="textSecondary">Melde dich an und leg direkt los.</AppText>
      </View>

      {!isSupabaseConfigured ? (
        <AppText color="danger">
          Supabase ist nicht konfiguriert. Lege eine .env nach dem Muster von .env.example an und starte den
          Dev-Server neu.
        </AppText>
      ) : null}

      <TextField
        label="E-Mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={submit}
      />

      {error ? (
        <AppText color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      <Button title="Anmelden" onPress={submit} loading={loading} disabled={!isSupabaseConfigured} />
      <SocialSignIn disabled={loading || !isSupabaseConfigured} onError={setError} />

      <View style={styles.footer}>
        <AppText color="textSecondary">Noch kein Konto?</AppText>
        <Link href="/register">
          <AppText color="accent" variant="heading">
            Registrieren
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.six },
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.three },
});
