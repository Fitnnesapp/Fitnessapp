import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PremiumPromptProps = {
  title: string;
  text: string;
};

/** Hinweiskarte für gesperrte Funktionen mit Weg zur Paywall. */
export function PremiumPrompt({ title, text }: PremiumPromptProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Card>
      <View style={styles.row}>
        <Ionicons name="lock-closed" size={22} color={theme.accent} />
        <AppText variant="heading" style={styles.title}>
          {title}
        </AppText>
      </View>
      <AppText color="textSecondary">{text}</AppText>
      <Button title="Premium ansehen" variant="secondary" onPress={() => router.push('/profile/premium')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
});
