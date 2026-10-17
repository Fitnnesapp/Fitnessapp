import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth/auth-provider';
import { signOut } from '@/lib/supabase/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const { session, isLoading } = useAuth();
  const profile = useProfile();

  const isSignedIn = session !== null;
  const ready = !isLoading && !(isSignedIn && profile.isLoading);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (isSignedIn && profile.isError) {
    return (
      <Screen topInset contentStyle={styles.centered}>
        <AppText variant="title">Profil konnte nicht geladen werden</AppText>
        <AppText color="textSecondary">Prüfe deine Internetverbindung und versuche es erneut.</AppText>
        <Button title="Erneut versuchen" onPress={() => profile.refetch()} />
        <Button title="Abmelden" variant="ghost" onPress={() => signOut()} />
      </Screen>
    );
  }

  // Ohne abgeschlossenen Consent-Flow bleibt die App gesperrt
  const needsConsent = isSignedIn && !profile.data?.consent_completed_at;

  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={needsConsent}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={isSignedIn && !needsConsent}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>

        <Stack.Screen name="auth/callback" />
        <Stack.Screen
          name="legal/privacy"
          options={{ headerShown: true, title: 'Datenschutzerklärung', presentation: 'modal' }}
        />
        <Stack.Screen
          name="legal/terms"
          options={{ headerShown: true, title: 'Nutzungsbedingungen', presentation: 'modal' }}
        />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flexGrow: 1, justifyContent: 'center' },
});
