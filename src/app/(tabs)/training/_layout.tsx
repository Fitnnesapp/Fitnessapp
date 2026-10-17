import { Stack } from 'expo-router';

export default function TrainingLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Training' }} />
      <Stack.Screen name="strength" options={{ title: 'Kraft' }} />
      <Stack.Screen name="exercises" options={{ title: 'Übungen' }} />
      <Stack.Screen name="exercise/[id]" options={{ title: 'Übung' }} />
      <Stack.Screen name="workout" options={{ title: 'Workout', headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen
        name="summary/[id]"
        options={{ title: 'Zusammenfassung', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="home" options={{ title: 'Home-Workouts' }} />
      <Stack.Screen name="program/[id]" options={{ title: 'Programm' }} />
      <Stack.Screen
        name="player/[id]"
        options={{ title: 'Workout', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="home-summary/[id]"
        options={{ title: 'Zusammenfassung', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="running" options={{ title: 'Running' }} />
    </Stack>
  );
}
