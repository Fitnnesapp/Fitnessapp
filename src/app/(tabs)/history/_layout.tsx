import { Stack } from 'expo-router';

export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Verlauf' }} />
    </Stack>
  );
}
