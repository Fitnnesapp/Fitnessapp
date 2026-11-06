import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { CURRENT_NEWS, useNewsStore } from '@/lib/storage/news-store';

type Item = { icon: ComponentProps<typeof Ionicons>['name']; title: string; text: string; href: Href };

const ITEMS: Item[] = [
  { icon: 'heart', title: 'Dein Gesundheits-Nutzen', text: 'Jede Woche dein Stand zur WHO-Empfehlung', href: '/dashboard' },
  { icon: 'bicycle', title: 'Radfahren', text: 'Radtouren mit GPS aufzeichnen oder nachtragen', href: '/training/running' },
  { icon: 'pause-circle', title: 'Auto-Pause & Ansagen', text: 'Ampelstopps zählen nicht, jeder Kilometer wird angesagt', href: '/training/running' },
  { icon: 'heart-circle', title: 'Apple Health', text: 'Workouts landen automatisch in der Health-App', href: '/profile' },
  { icon: 'compass', title: 'Dein Warum', text: 'Halte fest, wofür du trainierst', href: '/profile' },
];

/** Einmalige Karte mit neuen Funktionen. Verschwindet nach "Verstanden" bis zur nächsten Ausgabe. */
export function WhatsNewCard() {
  const router = useRouter();
  const theme = useTheme();
  const { seen, hydrated, markSeen } = useNewsStore();

  if (!hydrated || seen === CURRENT_NEWS) return null;

  return (
    <Card style={[styles.card, { borderColor: theme.accent }]}>
      <AppText variant="eyebrow" color="accent">
        Neu in deiner App
      </AppText>
      <AppText variant="title">Mehr Nutzen aus jedem Training</AppText>
      {ITEMS.map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="link"
          accessibilityLabel={`${item.title}: ${item.text}`}
          onPress={() => {
            tapFeedback();
            router.push(item.href);
          }}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name={item.icon} size={18} color={theme.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="label">{item.title}</AppText>
            <AppText variant="caption" color="textSecondary">
              {item.text}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </Pressable>
      ))}
      <Button title="Verstanden" variant="secondary" onPress={markSeen} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  icon: { width: 36, height: 36, borderRadius: Radius.small, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 1 },
  pressed: { opacity: 0.7 },
});
