import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Option = {
  href: Href;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const OPTIONS: Option[] = [
  { href: '/strength', title: 'Kraft', description: 'Sätze, Gewichte und Rekorde loggen', icon: 'barbell-outline' },
  { href: '/home', title: 'Home-Workout', description: 'Geführte Einheiten ohne Equipment', icon: 'home-outline' },
  { href: '/running', title: 'Running', description: 'Laufen mit GPS-Tracking', icon: 'walk-outline' },
];

export default function TrainingScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <AppText variant="display">Was trainierst du heute?</AppText>
      {OPTIONS.map((option) => (
        <Card key={option.title} onPress={() => router.push(option.href)} style={styles.card}>
          <Ionicons name={option.icon} size={32} color={theme.accent} />
          <View style={styles.text}>
            <AppText variant="heading">{option.title}</AppText>
            <AppText color="textSecondary">{option.description}</AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  text: { flex: 1, gap: Spacing.one },
});
