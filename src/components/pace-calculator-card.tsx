import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseDuration } from '@/lib/logic/manual-run';
import { evenSplits, formatRaceTime, RACE_DISTANCES } from '@/lib/logic/run-insights';
import { formatPace, paceUnitLabel } from '@/lib/logic/units';
import { useSettings } from '@/lib/storage/settings-store';

/** Zielzeit eingeben, Tempo und Zwischenzeiten ablesen. Rein rechnerisch, nichts wird gespeichert. */
export function PaceCalculatorCard() {
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const [raceIndex, setRaceIndex] = useState(1);
  const [timeText, setTimeText] = useState('');

  const target = useSettings((state) => state.targetPaceSecPerKm);
  const setTargetPace = useSettings((state) => state.setTargetPace);
  const race = RACE_DISTANCES[raceIndex];
  const seconds = parseDuration(timeText);
  const valid = seconds !== null && seconds >= 60;
  const pace = valid ? seconds / (race.meters / 1000) : null;
  const splits = valid ? evenSplits(race.meters, seconds) : [];

  return (
    <Card style={styles.card}>
      <AppText variant="label" color="textSecondary">
        PACE-RECHNER
      </AppText>
      <View style={styles.chips}>
        {RACE_DISTANCES.map((item, index) => (
          <Chip key={item.label} label={item.label} selected={raceIndex === index} onPress={() => setRaceIndex(index)} />
        ))}
      </View>
      <TextField
        label="Zielzeit"
        value={timeText}
        onChangeText={setTimeText}
        placeholder={race.meters > 21000 ? '3:59:00' : race.meters > 10000 ? '1:55:00' : '25:00'}
        keyboardType="numbers-and-punctuation"
        maxLength={8}
      />
      {pace !== null ? (
        <>
          <AppText variant="title">
            {formatPace(pace, units)} <AppText color="textSecondary">{paceUnitLabel(units)}</AppText>
          </AppText>
          <View style={styles.splits}>
            {splits.map((split) => (
              <View key={split.meters} style={[styles.split, { borderColor: theme.border }]}>
                <AppText variant="caption" color="textSecondary">
                  {split.meters === race.meters ? 'Ziel' : `${split.meters / 1000} km`}
                </AppText>
                <AppText variant="label">{formatRaceTime(split.seconds)}</AppText>
              </View>
            ))}
          </View>
          <AppText variant="caption" color="textSecondary">
            Bei gleichmäßigem Tempo. Die Zwischenzeiten gelten in Kilometern.
          </AppText>
          <Button
            title={target !== null && Math.abs(target - pace) < 1 ? 'Ist dein Zieltempo' : 'Als Zieltempo für Läufe übernehmen'}
            variant="secondary"
            disabled={target !== null && Math.abs(target - pace) < 1}
            onPress={() => setTargetPace(pace)}
          />
        </>
      ) : (
        <AppText variant="caption" color="textSecondary">
          Gib eine Zielzeit ein, z.B. 50:00 oder 1:55:00, und sieh das nötige Tempo samt Zwischenzeiten.
        </AppText>
      )}
      {target !== null ? (
        <View style={styles.targetRow}>
          <AppText variant="caption" color="textSecondary" style={styles.flex}>
            Zieltempo: {formatPace(target, units)} {paceUnitLabel(units)}. Beim Lauf siehst und hörst du, ob du davor oder
            dahinter liegst.
          </AppText>
          <Button title="Entfernen" variant="ghost" onPress={() => setTargetPace(null)} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  splits: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  split: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    minWidth: 72,
  },
});
