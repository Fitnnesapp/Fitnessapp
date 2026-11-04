import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useSettings } from '@/lib/storage/settings-store';

/** Farben der aktuellen Darstellung: Einstellung im Profil, sonst wie das System (Standard dunkel). */
export function useTheme(): ThemeColors & { scheme: 'light' | 'dark' } {
  const system = useColorScheme();
  const appearance = useSettings((state) => state.appearance);
  const scheme = appearance === 'system' ? (system === 'light' ? 'light' : 'dark') : appearance;

  return { ...Colors[scheme], scheme };
}
