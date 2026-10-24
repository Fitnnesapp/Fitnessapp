import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ImageCard } from '@/components/ui/image-card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { SCENES } from '@/data/images';
import { useTheme } from '@/hooks/use-theme';

type Option = {
  href: Href;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  image: ImageSourcePropType;
};

const OPTIONS: Option[] = [
  { href: '/training/strength', title: 'Kraft', description: 'Sätze, Gewichte und Rekorde loggen', icon: 'barbell', image: SCENES['hero-kraft'] },
  { href: '/training/home', title: 'Home-Workout', description: 'Geführte Einheiten ohne Equipment', icon: 'body', image: SCENES['hero-home'] },
  { href: '/training/running', title: 'Laufen', description: 'Mit GPS, Pace und Strecke', icon: 'walk', image: SCENES['hero-lauf'] },
];

/** Auswahl der Trainingsart als große Bildkarten, wie die Kategorien großer Trainings-Apps. */
export default function TrainingScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <AppText variant="display">Was trainierst du heute?</AppText>
      {OPTIONS.map((option) => (
        <ImageCard
          key={option.title}
          source={option.image}
          height={190}
          accessibilityLabel={`${option.title}: ${option.description}`}
          onPress={() => router.push(option.href)}>
          <View style={styles.row}>
            <View style={styles.text}>
              <AppText variant="hero" style={styles.onImage}>
                {option.title}
              </AppText>
              <AppText style={styles.onImageSoft}>{option.description}</AppText>
            </View>
            <View style={[styles.go, { backgroundColor: theme.accent }]}>
              <Ionicons name="arrow-forward" size={22} color="#0B0D10" />
            </View>
          </View>
        </ImageCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three },
  text: { flex: 1, gap: Spacing.one },
  onImage: { color: '#FFFFFF' },
  onImageSoft: { color: '#FFFFFF', opacity: 0.82 },
  go: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
