import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Profil' }} />
      <Stack.Screen name="privacy" options={{ title: 'Datenschutz' }} />
    </Stack>
  );
}
