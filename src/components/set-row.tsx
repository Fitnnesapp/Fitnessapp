import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DraftSet } from '@/types/workout';

type SetRowProps = {
  set: DraftSet;
  /** Position unter den Arbeitssätzen, ohne Aufwärmsätze */
  workingIndex: number;
  weightUnit: string;
  isRecord: boolean;
  onChange: (patch: Partial<Omit<DraftSet, 'id'>>) => void;
  onToggleDone: () => void;
  onRemove: () => void;
};

export function SetRow({ set, workingIndex, weightUnit, isRecord, onChange, onToggleDone, onRemove }: SetRowProps) {
  const theme = useTheme();

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: set.done ? theme.surfaceAlt : theme.background,
      borderColor: theme.border,
    },
  ];

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={set.isWarmup ? 'Als Arbeitssatz markieren' : 'Als Aufwärmsatz markieren'}
        onPress={() => onChange({ isWarmup: !set.isWarmup })}
        onLongPress={onRemove}
        style={[styles.index, { backgroundColor: set.isWarmup ? theme.surfaceAlt : 'transparent', borderColor: theme.border }]}>
        <AppText variant="label" color={set.isWarmup ? 'accent' : 'textSecondary'}>
          {set.isWarmup ? 'W' : String(workingIndex)}
        </AppText>
      </Pressable>

      <TextInput
        accessibilityLabel={`Gewicht in ${weightUnit}`}
        placeholder={weightUnit}
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        value={set.weight}
        onChangeText={(weight) => onChange({ weight })}
        style={[inputStyle, styles.weight]}
        selectTextOnFocus
      />
      <TextInput
        accessibilityLabel="Wiederholungen"
        placeholder="Wdh."
        placeholderTextColor={theme.textSecondary}
        keyboardType="number-pad"
        value={set.reps}
        onChangeText={(reps) => onChange({ reps })}
        style={[inputStyle, styles.reps]}
        selectTextOnFocus
      />
      <TextInput
        accessibilityLabel="RPE von 1 bis 10"
        placeholder="RPE"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        value={set.rpe}
        onChangeText={(rpe) => onChange({ rpe })}
        style={[inputStyle, styles.rpe]}
        selectTextOnFocus
      />

      <View style={styles.trophy}>
        {isRecord ? (
          <AppText accessibilityLabel="Neuer persönlicher Rekord" style={styles.trophyText}>
            🏆
          </AppText>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="Satz erledigt"
        accessibilityState={{ checked: set.done }}
        onPress={onToggleDone}
        style={[
          styles.check,
          { backgroundColor: set.done ? theme.accent : 'transparent', borderColor: set.done ? theme.accent : theme.border },
        ]}>
        <AppText variant="heading" style={{ color: set.done ? theme.onAccent : theme.textSecondary }}>
          ✓
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  index: {
    width: 30,
    height: 44,
    borderRadius: Radius.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 44,
    borderRadius: Radius.small,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  weight: { flex: 2, minWidth: 0 },
  reps: { flex: 1.5, minWidth: 0 },
  rpe: { flex: 1.2, minWidth: 0 },
  trophy: { width: 20, alignItems: 'center' },
  trophyText: { fontSize: 18, lineHeight: 22 },
  check: {
    width: 44,
    height: 44,
    borderRadius: Radius.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
