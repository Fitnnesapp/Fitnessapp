import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useRunStore } from '@/lib/storage/run-store';
import { useWorkouts } from '@/lib/storage/workout-store';

export const unstable_settings = { anchor: 'dashboard' };

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Reihenfolge nach Strava-Vorbild: Überblick links, Training als große Aktion in der Mitte,
 * Fortschritt und Profil rechts. So liegt der häufigste Weg ("jetzt trainieren") unter dem Daumen.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Tippt man auf den Tab, in dem man schon ist, geht es zurück zu dessen Startseite (wie in iOS-Apps üblich).
   * Ohne das blieb man z.B. im Rechner stehen, wenn man auf "Training" tippte.
   */
  const backToRoot = (root: string) => ({
    tabPress: (event: { preventDefault: () => void }) => {
      if (pathname.startsWith(`${root}/`)) {
        event.preventDefault();
        router.dismissTo(root as Href);
      }
    },
  });
  const workoutRunning = useWorkouts((state) => state.active !== null);
  const runRunning = useRunStore((state) => state.active !== null);
  const busy = workoutRunning || runRunning;

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
      <Tabs.Screen
        name="discover"
        listeners={backToRoot('/discover')}
        options={{ title: 'Entdecken', tabBarIcon: icon('compass-outline', 'compass') }}
      />
      <Tabs.Screen
        name="training"
        listeners={backToRoot('/training')}
        options={{
          title: 'Training',
          tabBarAccessibilityLabel: busy ? 'Training, eine Einheit läuft gerade' : 'Training starten',
          // Punkt am Training-Tab, solange ein Workout oder Lauf läuft
          tabBarBadge: busy ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.danger, minWidth: 12, maxHeight: 12, borderRadius: 6, top: 2 },
          tabBarIcon: ({ focused }) => (
            <View style={[styles.action, { backgroundColor: theme.accent, opacity: focused ? 1 : 0.92 }]}>
              <Ionicons name="add" size={28} color="#0B0D10" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        listeners={backToRoot('/history')}
        options={{ title: 'Fortschritt', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }}
      />
      <Tabs.Screen
        name="profile"
        listeners={backToRoot('/profile')}
        options={{ title: 'Profil', tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  action: { width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
