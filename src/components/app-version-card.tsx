import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { formatDate } from '@/lib/logic/format';
import { updateStatusText } from '@/lib/logic/updates';
import { applyAppUpdate, checkForAppUpdate, updateIdentity, updatesActive, useUpdateStore } from '@/lib/updates';

/** Version, Update-Status und manuelle Prüfung im Profil. */
export function AppVersionCard() {
  const phase = useUpdateStore((state) => state.phase);
  const version = Constants.expoConfig?.version ?? '–';
  const { createdAt } = updateIdentity();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <AppText variant="heading" style={styles.flex}>
          App-Version {version}
        </AppText>
        {createdAt ? (
          <AppText variant="caption" color="textSecondary">
            Stand {formatDate(createdAt.getTime())}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color="textSecondary">
        {updatesActive
          ? updateStatusText(phase)
          : 'Automatische Updates sind in der installierten App aktiv. Hier im Browser lädt die Seite immer die neueste Version.'}
      </AppText>
      {updatesActive ? (
        phase === 'ready' ? (
          <Button title="Jetzt neu starten" variant="secondary" onPress={() => void applyAppUpdate()} />
        ) : (
          <Button
            title="Nach Updates suchen"
            variant="ghost"
            loading={phase === 'checking' || phase === 'downloading'}
            onPress={() => void checkForAppUpdate(true)}
          />
        )
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
