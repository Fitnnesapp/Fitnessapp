import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { AppText } from './app-text';

type SectionHeaderProps = {
  title: string;
  action?: { label: string; onPress: () => void };
};

/** Abschnittsüberschrift mit optionalem Link rechts ("Alle ansehen"). */
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="title" style={styles.title} accessibilityRole="header">
        {title}
      </AppText>
      {action ? (
        <Pressable accessibilityRole="link" onPress={action.onPress} hitSlop={12}>
          <AppText variant="label" color="accent">
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.three, marginTop: Spacing.three },
  title: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '800' },
});
