import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { anchor: 'dashboard' };

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Reihenfolge nach Strava-Vorbild: Überblick links, Training als große Aktion in der Mitte,
 * Fortschritt und Profil rechts. So liegt der häufigste Weg ("jetzt trainieren") unter dem Daumen.
 */
export default function TabsLayout() {
  const theme = useTheme();

  const icon = (name: IconName, active: IconName) =>
    function TabIcon({ focused, size }: { focused: boolean; size: number }) {
      return <Ionicons name={focused ? active : name} color={focused ? theme.accent : theme.textSecondary} size={size} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Start', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="discover" options={{ title: 'Entdecken', tabBarIcon: icon('compass-outline', 'compass') }} />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarAccessibilityLabel: 'Training starten',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.action, { backgroundColor: theme.accent, opacity: focused ? 1 : 0.92 }]}>
              <Ionicons name="add" size={28} color="#0B0D10" />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="history" options={{ title: 'Fortschritt', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  action: { width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
