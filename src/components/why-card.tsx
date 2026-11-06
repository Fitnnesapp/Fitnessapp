import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { useTheme } from '@/hooks/use-theme';
import { shouldShowWhy } from '@/lib/logic/why';
import { useSettings } from '@/lib/storage/settings-store';

const DAY = 24 * 60 * 60 * 1000;

/** Erinnert an den eigenen Grund fürs Training, wenn es hilft: nach einer Pause oder am Montag. */
export function WhyCard({ now }: { now: number }) {
  const router = useRouter();
  const theme = useTheme();
  const why = useSettings((state) => state.why);
  const activities = useActivities();
  const last = activities.reduce((max, a) => Math.max(max, a.startedAt), 0);
  const daysSince = last > 0 ? Math.floor((now - last) / DAY) : null;

  if (!shouldShowWhy(why, daysSince, new Date(now).getDay())) return null;

  return (
    <Card onPress={() => router.push('/profile')} accessibilityLabel={`Dein Warum: ${why}. Im Profil ändern.`}>
      <View style={styles.head}>
        <Ionicons name="compass-outline" size={18} color={theme.accent} />
        <AppText variant="label" color="textSecondary">
          DEIN WARUM
        </AppText>
      </View>
      <AppText variant="title">„{why}“</AppText>
      {daysSince !== null && daysSince >= 3 ? (
        <AppText color="textSecondary">
          {daysSince} Tage Pause sind kein Problem. Eine kurze Einheit heute bringt dich wieder rein.
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
