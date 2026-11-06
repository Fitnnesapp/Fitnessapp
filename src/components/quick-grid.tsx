import { useRouter, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuickAction } from '@/components/ui/quick-action';
import { Spacing } from '@/constants/theme';
import { usePlanStore } from '@/lib/storage/plan-store';

type Tile = { icon: ComponentProps<typeof QuickAction>['icon']; label: string; href: Href };

/** Schnellzugriff auf alle Bereiche: zwei feste Reihen, immer an derselben Stelle. */
export function QuickGrid() {
  const router = useRouter();
  const hasPlan = usePlanStore((state) => state.plan !== null);

  const rows: Tile[][] = [
    [
      { icon: 'barbell-outline', label: 'Kraft', href: '/training/strength' },
      { icon: 'walk-outline', label: 'Laufen', href: '/training/running' },
      { icon: 'home-outline', label: 'Home', href: '/training/home' },
      { icon: 'timer-outline', label: 'Timer', href: '/training/timer' },
    ],
    [
      { icon: 'list-outline', label: 'Übungen', href: '/training/exercises' },
      { icon: 'trophy-outline', label: 'Rekorde', href: '/history/records' },
      { icon: 'flag-outline', label: 'Ziele', href: '/discover' },
      { icon: 'calendar-outline', label: 'Plan', href: hasPlan ? '/plan' : '/plan/setup' },
    ],
  ];

  return (
    <View style={styles.grid}>
      {rows.map((row, index) => (
        <View key={index} style={styles.row}>
          {row.map((tile) => (
            <QuickAction key={tile.label} icon={tile.icon} label={tile.label} onPress={() => router.push(tile.href)} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
});
