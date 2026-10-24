import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { GamificationSync } from '@/components/gamification-sync';
import { useTheme } from '@/hooks/use-theme';
import '@/lib/location/background-task';
import { useChallengeStore } from '@/lib/storage/challenge-store';
import { useEntitlementStore } from '@/lib/storage/entitlement-store';
import { useEventsStore } from '@/lib/storage/events-store';
import { useGamification } from '@/lib/storage/gamification-store';
import { useHealthStore } from '@/lib/storage/health-store';
import { useHomeSessions } from '@/lib/storage/home-store';
import { usePlanStore } from '@/lib/storage/plan-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const settingsReady = useSettings((state) => state.hydrated);
  const workoutsReady = useWorkouts((state) => state.hydrated);
  const homeReady = useHomeSessions((state) => state.hydrated);
  const runsReady = useRunStore((state) => state.hydrated);
  const gamificationReady = useGamification((state) => state.hydrated);
  const entitlementReady = useEntitlementStore((state) => state.hydrated);
  const planReady = usePlanStore((state) => state.hydrated);
  const challengesReady = useChallengeStore((state) => state.hydrated);
  const eventsReady = useEventsStore((state) => state.hydrated);
  const healthReady = useHealthStore((state) => state.hydrated);
  const hydrated =
    settingsReady && workoutsReady && homeReady && runsReady && gamificationReady && entitlementReady && planReady && challengesReady && eventsReady && healthReady;

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

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
      <GamificationSync />
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'fade_from_bottom' }} />
      </Stack>
    </ThemeProvider>
  );
}
