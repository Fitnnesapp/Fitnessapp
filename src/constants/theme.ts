export const Colors = {
  dark: {
    background: '#0E0F11',
    surface: '#17191C',
    surfaceAlt: '#212428',
    border: '#2C3036',
    text: '#F5F5F4',
    textSecondary: '#A1A1AA',
    accent: '#FF6B2C',
    /** Zart getönte Fläche im Akzentton, z.B. für Fortschrittsspuren */
    accentSoft: '#3A2418',
    onAccent: '#160A04',
    danger: '#FF5C7A',
    success: '#4ADE80',
  },
  light: {
    background: '#F7F6F4',
    surface: '#FFFFFF',
    surfaceAlt: '#F0EEEB',
    border: '#E2DFDA',
    text: '#111214',
    textSecondary: '#5F6168',
    accent: '#C2410C',
    accentSoft: '#FCE7DB',
    onAccent: '#FFFFFF',
    danger: '#D61F45',
    success: '#1F9D55',
  },
} as const;

/** Farben auf Bildern: Bilder sind in beiden Modi dunkel, darauf immer helle Schrift und das helle Orange. */
export const OnImage = {
  text: '#FFFFFF',
  accent: Colors.dark.accent,
  onAccent: Colors.dark.onAccent,
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
