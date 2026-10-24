export const Colors = {
  dark: {
    background: '#0B0D10',
    surface: '#14181D',
    surfaceAlt: '#1C2229',
    border: '#262D36',
    text: '#F4F6F8',
    textSecondary: '#9AA4AF',
    accent: '#C8F03C',
    /** Zart getönte Fläche im Akzentton, z.B. für Fortschrittsspuren */
    accentSoft: '#2A3313',
    onAccent: '#0B0D10',
    danger: '#FF6B6B',
    success: '#4ADE80',
  },
  light: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F3',
    border: '#DDE1E6',
    text: '#0B0D10',
    textSecondary: '#5B6570',
    accent: '#4F7A00',
    accentSoft: '#E6EFD3',
    onAccent: '#FFFFFF',
    danger: '#D93636',
    success: '#1F9D55',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.dark]: string };
export type ThemeColor = keyof ThemeColors;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 560;
