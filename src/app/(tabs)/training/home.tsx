import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Radius, Spacing } from '@/constants/theme';
import { CATEGORIES, isFreeProgram, PROGRAMS } from '@/data/programs';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { programMinutes } from '@/lib/logic/timeline';
import type { ProgramCategory, ProgramDifficulty } from '@/types/home';

type DurationFilter = 'short' | 'medium' | 'long';

const DURATIONS: { value: DurationFilter; label: string; matches: (minutes: number) => boolean }[] = [
  { value: 'short', label: 'Bis 10 Min', matches: (m) => m <= 10 },
  { value: 'medium', label: '10 bis 20 Min', matches: (m) => m > 10 && m <= 20 },
  { value: 'long', label: 'Über 20 Min', matches: (m) => m > 20 },
];

const DIFFICULTIES: ProgramDifficulty[] = ['Einsteiger', 'Fortgeschritten'];

export default function HomeProgramsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isPremium } = useSubscription();

  const [category, setCategory] = useState<ProgramCategory | null>(null);
  const [duration, setDuration] = useState<DurationFilter | null>(null);
  const [difficulty, setDifficulty] = useState<ProgramDifficulty | null>(null);

  const results = useMemo(() => {
    const durationRule = DURATIONS.find((d) => d.value === duration);
    return PROGRAMS.filter(
      (program) =>
        (!category || program.category === category) &&
        (!difficulty || program.difficulty === difficulty) &&
        (!durationRule || durationRule.matches(programMinutes(program))),
    );
  }, [category, duration, difficulty]);

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      data={results}
      keyExtractor={(program) => program.id}
      ListHeaderComponent={
        <View style={styles.filters}>
          <AppText variant="display" style={styles.headline}>
            Home-Workouts
          </AppText>
          <AppText color="textSecondary">Geführt, ohne Geräte. Wähle nach Ziel, Zeit oder Niveau.</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORIES.map((item) => (
              <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(category === item ? null : item)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {DURATIONS.map((item) => (
              <Chip key={item.value} label={item.label} selected={duration === item.value} onPress={() => setDuration(duration === item.value ? null : item.value)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {DIFFICULTIES.map((item) => (
              <Chip key={item} label={item} selected={difficulty === item} onPress={() => setDifficulty(difficulty === item ? null : item)} />
            ))}
          </ScrollView>
          <AppText variant="caption" color="textSecondary">
            {results.length} {results.length === 1 ? 'Programm' : 'Programme'}
          </AppText>
        </View>
      }
      ListEmptyComponent={<AppText color="textSecondary">Kein Programm passt zu diesen Filtern.</AppText>}
      renderItem={({ item }) => {
        const locked = !isPremium && !isFreeProgram(item.id);
        return (
          <Card onPress={() => router.push({ pathname: '/training/program/[id]', params: { id: item.id } })} style={styles.card}>
            <View style={[styles.minutes, { backgroundColor: locked ? theme.surfaceAlt : theme.accentSoft }]}>
              <AppText variant="number" color={locked ? 'textSecondary' : 'accent'} style={styles.minutesNumber}>
                {programMinutes(item)}
              </AppText>
              <AppText variant="eyebrow" color={locked ? 'textSecondary' : 'accent'}>
                Min
              </AppText>
            </View>
            <View style={styles.flex}>
              <View style={styles.metaRow}>
                <AppText variant="eyebrow" color="textSecondary">
                  {item.category} · {item.difficulty}
                </AppText>
                {locked ? <Ionicons name="lock-closed" size={13} color={theme.textSecondary} accessibilityLabel="Premium" /> : null}
              </View>
              <AppText variant="heading">{item.name}</AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                {item.description}
              </AppText>
            </View>
          </Card>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  filters: { gap: Spacing.three, marginBottom: Spacing.three },
  chips: { gap: Spacing.two },
  separator: { height: Spacing.three },
  flex: { flex: 1, gap: 2 },
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  minutes: { width: 64, height: 64, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  minutesNumber: { fontSize: 26, lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
