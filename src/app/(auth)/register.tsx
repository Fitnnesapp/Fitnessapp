import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SocialSignIn } from '@/components/social-sign-in';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { authErrorMessage, isValidEmail, MIN_PASSWORD_LENGTH } from '@/lib/logic/auth-errors';
import { signUpWithEmail } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function submit() {
    if (name.trim().length === 0) return setError('Bitte gib einen Namen ein.');
    if (!isValidEmail(email)) return setError('Bitte gib eine gültige E-Mail-Adresse ein.');
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`);
    }

    setError(null);
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUpWithEmail(email, password, name);
      // Ohne Bestätigungspflicht ist der Nutzer jetzt angemeldet, die Navigation wechselt automatisch
      if (needsEmailConfirmation) setConfirmationSent(true);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <Screen topInset contentStyle={styles.content}>
        <AppText variant="display">Fast geschafft.</AppText>
        <AppText color="textSecondary">
          Wir haben dir eine Bestätigungsmail an {email.trim()} geschickt. Öffne den Link darin und melde dich danach
          an.
        </AppText>
        <Link href="/login" asChild>
          <Button title="Zur Anmeldung" onPress={() => {}} />
        </Link>
      </Screen>
    );
  }

  return (
    <Screen topInset contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="display">Konto erstellen.</AppText>
        <AppText color="textSecondary">Kraft, Home-Workouts und Running an einem Ort.</AppText>
      </View>

      <TextField label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
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
        label={`Passwort (mind. ${MIN_PASSWORD_LENGTH} Zeichen)`}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
      />

      {error ? (
        <AppText color="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      <Button title="Registrieren" onPress={submit} loading={loading} disabled={!isSupabaseConfigured} />
      <SocialSignIn disabled={loading || !isSupabaseConfigured} onError={setError} />

      <View style={styles.footer}>
        <AppText color="textSecondary">Schon registriert?</AppText>
        <Link href="/login">
          <AppText color="accent" variant="heading">
            Anmelden
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
