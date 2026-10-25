import { Stack } from 'expo-router';

// Abzeichen und Rückblick werden auch von Start aus geöffnet: die Übersicht liegt dann darunter, damit "Zurück" funktioniert
export const unstable_settings = { initialRouteName: 'index' };

/** Fortschritt: Verlauf aller Einheiten, Abzeichen und Jahresrückblick an einem Ort. */
export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Fortschritt' }} />
      <Stack.Screen name="[id]" options={{ title: 'Workout' }} />
      <Stack.Screen name="badges" options={{ title: 'Abzeichen' }} />
      <Stack.Screen name="year" options={{ title: 'Jahresrückblick' }} />
    </Stack>
  );
}
