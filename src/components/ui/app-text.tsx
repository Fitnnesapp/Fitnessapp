import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppTextProps = TextProps & {
  variant?: 'display' | 'hero' | 'title' | 'heading' | 'body' | 'caption' | 'label' | 'number' | 'eyebrow';
  color?: ThemeColor;
};

export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[color] }, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1 },
  hero: { fontSize: 32, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.4 },
  /** Große Kennzahl im Sport-Stil: fett, eng, Ziffern gleich breit */
  number: { fontSize: 40, lineHeight: 44, fontWeight: '900', letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  /** Kleine Dachzeile über Abschnitten und Kennzahlen */
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
});
