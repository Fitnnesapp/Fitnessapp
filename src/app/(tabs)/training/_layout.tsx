import { Stack } from 'expo-router';

export default function TrainingLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Training' }} />
      <Stack.Screen name="strength" options={{ title: 'Kraft' }} />
      <Stack.Screen name="home" options={{ title: 'Home-Workout' }} />
      <Stack.Screen name="running" options={{ title: 'Running' }} />
    </Stack>
  );
}
