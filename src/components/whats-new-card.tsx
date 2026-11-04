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
  { icon: 'flash', title: 'Fertige Workouts', text: 'Push, Pull, Beine, 5×5 und mehr, mit Tagesempfehlung', href: '/training/strength' },
  { icon: 'body', title: 'Muskelkarte', text: 'Sieh, was jede Übung trainiert und was erholt ist', href: '/training/exercises' },
  { icon: 'flag', title: 'Kraftziele & Rekordbuch', text: 'Zielgewicht setzen und Bestwerte im Blick', href: '/history/records' },
  { icon: 'stopwatch', title: 'Laufprognose', text: 'Bestzeiten und was heute über 5 km bis Marathon drin wäre', href: '/training/running' },
  { icon: 'cloud-download', title: 'Datensicherung', text: 'Alles als Datei sichern und aufs neue Handy mitnehmen', href: '/profile' },
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
      <AppText variant="title">Mehr Training, mehr Durchblick</AppText>
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
