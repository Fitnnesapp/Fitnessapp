import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './app-text';

type StatProps = {
  value: string;
  unit?: string;
  label: string;
  /** large: Hauptkennzahl, medium: Zeile mit mehreren Kennzahlen */
  size?: 'large' | 'medium';
  style?: StyleProp<ViewStyle>;
};

/** Kennzahl im Sport-Stil: Dachzeile, große fette Zahl, kleine Einheit daneben. */
export function Stat({ value, unit, label, size = 'medium', style }: StatProps) {
  return (
    <View style={[styles.wrap, style]} accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`}>
      <AppText variant="eyebrow" color="textSecondary" numberOfLines={1}>
        {label}
      </AppText>
      <View style={styles.row}>
        <AppText variant="number" style={size === 'medium' ? styles.medium : undefined}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="label" color="textSecondary">
            {unit}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2, flexShrink: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 3 },
  // passt dreimal nebeneinander auf ein 375-pt-Handy, auch bei "10:45 Std"
  medium: { fontSize: 26, lineHeight: 30, letterSpacing: -0.8 },
});
