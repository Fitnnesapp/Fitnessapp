import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ruhiges Symbol im Akzentkreis für Begrüßungs- und Erfolgsmomente (ersetzt die frühere Kettlebell-Grafik). */
export function IconBadge({ icon, size = 96 }: { icon: IconName; size?: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.accentSoft }]}>
      <View
        style={[
          styles.inner,
          { width: size * 0.64, height: size * 0.64, borderRadius: size * 0.32, backgroundColor: theme.accent },
        ]}>
        <Ionicons name={icon} size={size * 0.32} color={theme.onAccent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  inner: { alignItems: 'center', justifyContent: 'center' },
});
