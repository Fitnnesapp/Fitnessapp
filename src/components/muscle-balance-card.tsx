import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PremiumPrompt } from '@/components/premium-prompt';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { useNow } from '@/hooks/use-now';
import { useSubscription } from '@/hooks/use-subscription';
import { useTheme } from '@/hooks/use-theme';
import { muscleVolume } from '@/lib/logic/analytics';
import { formatWeight } from '@/lib/logic/units';
import { useSettings } from '@/lib/storage/settings-store';
import { useWorkouts } from '@/lib/storage/workout-store';

/** Trainingsvolumen je Muskelgruppe der letzten 30 Tage (Premium). */
export function MuscleBalanceCard() {
  const theme = useTheme();
  const now = useNow(60_000);
  const units = useSettings((state) => state.units);
  const history = useWorkouts((state) => state.history);
  const { isPremium } = useSubscription();

  const muscles = useMemo(() => muscleVolume(history, 30, now, (id) => getExercise(id)?.muscleGroup), [history, now]);
  const max = Math.max(1, ...muscles.map((m) => m.volumeKg));

  if (!isPremium) {
    return (
      <PremiumPrompt
        title="Muskelgruppen-Analyse"
        text="Sieh, welche Muskelgruppen du in den letzten 30 Tagen wie stark trainiert hast."
      />
    );
  }

  return (
    <Card>
      <AppText variant="eyebrow" color="textSecondary">
        Muskelgruppen · 30 Tage
      </AppText>
      {muscles.length === 0 ? (
        <AppText color="textSecondary">Noch kein Krafttraining in den letzten 30 Tagen.</AppText>
      ) : (
        muscles.map((m) => (
          <View key={m.group} style={styles.row}>
            <AppText style={styles.name}>{m.group}</AppText>
            <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
              <View style={[styles.fill, { backgroundColor: theme.accent, width: `${Math.round((m.volumeKg / max) * 100)}%` }]} />
            </View>
            <AppText variant="caption" color="textSecondary" style={styles.value}>
              {formatWeight(m.volumeKg, units)}
            </AppText>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { width: 84 },
  track: { flex: 1, height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  value: { width: 64, textAlign: 'right' },
});
