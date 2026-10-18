import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
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
      renderItem={({ item }) => (
        <Card onPress={() => router.push({ pathname: '/training/program/[id]', params: { id: item.id } })}>
          <AppText variant="label" color="accent">
            {item.category.toUpperCase()}
            {!isPremium && !isFreeProgram(item.id) ? '  ·  🔒 PREMIUM' : ''}
          </AppText>
          <AppText variant="heading">{item.name}</AppText>
          <AppText color="textSecondary">{item.description}</AppText>
          <AppText variant="caption" color="textSecondary">
            {programMinutes(item)} Min · {item.difficulty} · {item.steps.length * item.rounds} Übungen
          </AppText>
        </Card>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  filters: { gap: Spacing.three, marginBottom: Spacing.three },
  chips: { gap: Spacing.two },
  separator: { height: Spacing.three },
});
