import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './app-text';

type OptionCardProps = {
  title: string;
  hint?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Bild statt Icon */
  image?: ImageSourcePropType;
  selected: boolean;
  /** Kleines Etikett wie "Empfohlen" */
  tag?: string;
  onPress: () => void;
};

/** Große, gut treffbare Auswahlkarte für Fragen mit wenigen Antworten. */
export function OptionCard({ title, hint, icon, image, selected, tag, onPress }: OptionCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? theme.accentSoft : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      {image ? (
        <Image source={image} style={styles.image} resizeMode="cover" />
      ) : icon ? (
        <View style={[styles.icon, { backgroundColor: selected ? theme.accent : theme.surfaceAlt }]}>
          <Ionicons name={icon} size={22} color={selected ? theme.onAccent : theme.text} />
        </View>
      ) : null}
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <AppText variant="heading">{title}</AppText>
          {tag ? (
            <View style={[styles.tag, { borderColor: theme.accent }]}>
              <AppText variant="caption" color="accent">
                {tag}
              </AppText>
            </View>
          ) : null}
        </View>
        {hint ? (
          <AppText variant="caption" color="textSecondary">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={selected ? theme.accent : theme.border}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 2,
  },
  pressed: { opacity: 0.8 },
  icon: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  image: { width: 64, height: 64, borderRadius: Radius.medium },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  tag: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.two },
});
