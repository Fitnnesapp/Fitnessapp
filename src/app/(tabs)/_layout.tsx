import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { initialRouteName: 'training' };

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}>
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarIcon: ({ focused, size }) => <Ionicons name="barbell-outline" color={focused ? theme.accent : theme.textSecondary} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Verlauf',
          tabBarIcon: ({ focused, size }) => <Ionicons name="calendar-outline" color={focused ? theme.accent : theme.textSecondary} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, size }) => <Ionicons name="person-outline" color={focused ? theme.accent : theme.textSecondary} size={size} />,
        }}
      />
    </Tabs>
  );
}
