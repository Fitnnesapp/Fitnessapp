import { Stack } from 'expo-router';

export default function PlanLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="setup" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="index" options={{ title: 'Dein Trainingsplan' }} />
    </Stack>
  );
}
