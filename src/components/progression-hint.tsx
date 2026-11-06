import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import type { ProgressionTip } from '@/lib/logic/progression';

type ProgressionHintProps = {
  tip: ProgressionTip;
  unit: string;
  /** Übernimmt Gewicht und Wiederholungen in alle offenen Arbeitssätze; fehlt, wenn nichts zu übernehmen ist */
  onApply?: () => void;
};

const number = (value: number) => String(value).replace('.', ',');

/** Kleiner Coach über den Sätzen: was letztes Mal war und was heute dran ist. */
export function ProgressionHint({ tip, unit, onApply }: ProgressionHintProps) {
  const theme = useTheme();
  const icon = tip.action === 'weight' || tip.action === 'harder' ? 'trending-up' : tip.action === 'first' ? 'compass-outline' : 'repeat';

  const target =
    tip.weight !== null && tip.reps !== null
      ? `${number(tip.weight)} ${unit} × ${tip.reps}`
      : tip.reps !== null
        ? `${tip.reps} Wdh.`
        : null;

  return (
    <View style={[styles.box, { backgroundColor: theme.accentSoft }]}>
      <Ionicons name={icon} size={18} color={theme.accent} style={styles.icon} />
      <View style={styles.flex}>
        {tip.last ? (
          <AppText variant="caption" color="textSecondary">
            Letztes Mal: {tip.last.weight > 0 ? `${number(tip.last.weight)} ${unit} × ` : ''}
            {tip.last.reps.join(' · ')}
          </AppText>
        ) : null}
        <AppText variant="caption">{tip.text}</AppText>
      </View>
      {onApply && target ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ziel übernehmen: ${target}`}
          hitSlop={8}
          onPress={() => {
            tapFeedback();
            onApply();
          }}
          style={({ pressed }) => [styles.apply, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
          <AppText variant="label" color="onAccent" numberOfLines={1}>
            {target}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.medium },
  icon: { alignSelf: 'flex-start', marginTop: 1 },
  flex: { flex: 1, gap: 2 },
  apply: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.pill },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
