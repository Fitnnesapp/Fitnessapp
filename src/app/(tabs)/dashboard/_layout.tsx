import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Start' }} />
      <Stack.Screen name="badges" options={{ title: 'Abzeichen' }} />
      <Stack.Screen name="year" options={{ title: 'Jahresrückblick' }} />
    </Stack>
  );
}
