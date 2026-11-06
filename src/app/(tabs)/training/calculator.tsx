import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  BARS,
  estimateOneRepMax,
  LOAD_STEP,
  MAX_REPS_FOR_ESTIMATE,
  percentTable,
  PLATES,
  platesPerSide,
} from '@/lib/logic/strength-calc';
import { parseNumber, weightUnitLabel } from '@/lib/logic/units';
import { useSettings } from '@/lib/storage/settings-store';

/** Zahlen deutsch formatiert, ohne unnötige Nachkommastellen. */
const num = (value: number) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100).replace('.', ','));

/**
 * Kraft-Rechner: 1RM aus einem Satz schätzen (mit Prozenttabelle für die Trainingsplanung)
 * und ausrechnen, welche Scheiben pro Seite auf die Stange gehören.
 */
export default function CalculatorScreen() {
  const theme = useTheme();
  const units = useSettings((state) => state.units);
  const unit = weightUnitLabel(units);
  const params = useLocalSearchParams<{ weight?: string; reps?: string }>();

  const [weightInput, setWeightInput] = useState(params.weight ?? '');
  const [repsInput, setRepsInput] = useState(params.reps ?? '');
  const [targetInput, setTargetInput] = useState('');
  const [bar, setBar] = useState(BARS[units][0]);

  const weight = parseNumber(weightInput);
  const reps = parseNumber(repsInput);
  const oneRm = weight !== null && reps !== null ? estimateOneRepMax(weight, reps) : null;
  const repsTooHigh = reps !== null && reps > MAX_REPS_FOR_ESTIMATE;

  const target = parseNumber(targetInput);
  const plates = target !== null ? platesPerSide(target, bar, PLATES[units]) : null;
  const heaviest = Math.max(...PLATES[units]);

  return (
    <Screen>
      <AppText variant="display">Kraft-Rechner</AppText>

      {/* 1RM-Schätzung */}
      <Card>
        <AppText variant="label" color="accent">
          MAXIMALGEWICHT SCHÄTZEN
        </AppText>
        <AppText color="textSecondary">Trag einen harten Satz ein. Die App schätzt, was du einmal schaffen würdest.</AppText>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label={`Gewicht (${unit})`}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="80"
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Wiederholungen"
              value={repsInput}
              onChangeText={setRepsInput}
              keyboardType="number-pad"
              placeholder="8"
              error={repsTooHigh ? `Höchstens ${MAX_REPS_FOR_ESTIMATE}` : undefined}
            />
          </View>
        </View>

        {oneRm !== null ? (
          <>
            <View style={styles.result}>
              <AppText variant="caption" color="textSecondary">
                Geschätztes 1RM
              </AppText>
              <AppText variant="display" style={styles.tabular}>
                {num(oneRm)} {unit}
              </AppText>
            </View>
            <View style={[styles.table, { borderColor: theme.border }]}>
              {percentTable(oneRm, LOAD_STEP[units]).map((row, i) => (
                <View
                  key={row.percent}
                  style={[styles.tableRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <AppText color="textSecondary" style={[styles.cell, styles.tabular]}>
                    {row.percent} %
                  </AppText>
                  <AppText variant="heading" style={[styles.cell, styles.tabular]}>
                    {num(row.weight)} {unit}
                  </AppText>
                  <AppText color="textSecondary" style={[styles.cellRight, styles.tabular]}>
                    {row.reps} Wdh.
                  </AppText>
                </View>
              ))}
            </View>
            <AppText variant="caption" color="textSecondary">
              Schätzung nach der Epley-Formel. Gewichte auf {num(LOAD_STEP[units])} {unit} abgerundet, Wiederholungen
              sind Richtwerte. Teste dein echtes Maximum nur
              aufgewärmt und mit Sicherung.
            </AppText>
          </>
        ) : null}
      </Card>

      {/* Scheibenrechner */}
      <Card>
        <AppText variant="label" color="accent">
          SCHEIBEN PRO SEITE
        </AppText>
        <TextField
          label={`Zielgewicht mit Stange (${unit})`}
          value={targetInput}
          onChangeText={setTargetInput}
          keyboardType="decimal-pad"
          placeholder={units === 'metric' ? '100' : '225'}
        />
        <AppText variant="label" color="textSecondary">
          STANGE
        </AppText>
        <View style={styles.chips}>
          {BARS[units].map((b) => (
            <Chip key={b} label={`${num(b)} ${unit}`} selected={b === bar} onPress={() => setBar(b)} />
          ))}
        </View>

        {plates ? (
          <>
            {plates.perSide.length === 0 ? (
              <AppText color="textSecondary">Nur die Stange, keine Scheiben nötig.</AppText>
            ) : (
              <View style={styles.barbell} accessibilityLabel={`Pro Seite: ${plates.perSide.map(num).join(', ')} ${unit}`}>
                <View style={[styles.sleeve, { backgroundColor: theme.textSecondary }]} />
                {plates.perSide.map((p, i) => (
                  <View
                    key={`${p}-${i}`}
                    style={[
                      styles.plate,
                      { backgroundColor: theme.accent, height: 44 + (p / heaviest) * 76 },
                    ]}>
                    <AppText variant="label" style={[styles.plateLabel, { color: theme.onAccent }]}>
                      {num(p)}
                    </AppText>
                  </View>
                ))}
                <View style={[styles.collar, { backgroundColor: theme.textSecondary }]} />
              </View>
            )}
            <AppText variant="heading">
              {plates.perSide.length > 0 ? `Pro Seite: ${plates.perSide.map(num).join(' + ')} ${unit}` : ''}
            </AppText>
            <AppText color={plates.missing > 0 ? 'accent' : 'textSecondary'}>
              {plates.missing > 0
                ? `Geladen: ${num(plates.loaded)} ${unit}. ${num(plates.missing)} ${unit} lassen sich mit Standardscheiben nicht genau laden.`
                : `Geladen: ${num(plates.loaded)} ${unit}`}
            </AppText>
          </>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  result: { alignItems: 'center', gap: 2, paddingVertical: Spacing.two },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, paddingHorizontal: Spacing.three },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.two },
  cell: { flex: 1 },
  cellRight: { flex: 1, textAlign: 'right', minWidth: 72 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  barbell: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 130, paddingVertical: Spacing.two },
  sleeve: { width: 28, height: 12, borderRadius: 3 },
  collar: { width: 10, height: 26, borderRadius: 3 },
  plate: { width: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  plateLabel: { fontSize: 11, transform: [{ rotate: '-90deg' }], width: 60, textAlign: 'center' },
});
