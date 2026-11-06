import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Profil', headerShown: false }} />
      <Stack.Screen name="premium" options={{ title: 'Premium' }} />
    </Stack>
  );
}
