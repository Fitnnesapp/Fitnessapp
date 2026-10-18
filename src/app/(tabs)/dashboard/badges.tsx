import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BADGES } from '@/lib/logic/badges';
import { useGamification } from '@/lib/storage/gamification-store';

const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

export default function BadgesScreen() {
  const theme = useTheme();
  const earned = useGamification((state) => state.earned);

  return (
    <Screen>
      <AppText color="textSecondary">
        {Object.keys(earned).length} von {BADGES.length} Abzeichen erreicht.
      </AppText>

      {BADGES.map((badge) => {
        const at = earned[badge.key];
        const has = at !== undefined;

        return (
          <Card key={badge.key} style={[styles.card, !has && styles.locked]}>
            <Ionicons
              name={has ? (badge.icon as keyof typeof Ionicons.glyphMap) : 'lock-closed-outline'}
              size={32}
              color={has ? theme.accent : theme.textSecondary}
            />
            <View style={styles.text}>
              <AppText variant="heading">{badge.name}</AppText>
              <AppText color="textSecondary">{badge.description}</AppText>
              {has ? (
                <AppText variant="caption" color="accent">
                  Erreicht am {DATE_FORMAT.format(at)}
                </AppText>
              ) : null}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  locked: { opacity: 0.6 },
  text: { flex: 1, gap: Spacing.one },
});
