import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pickBackupText, shareBackupFile } from '@/lib/backup-file';
import { confirmAction } from '@/lib/confirm';
import { successFeedback } from '@/lib/haptics';
import { backupFileName, parseBackup } from '@/lib/logic/backup';
import { exportBackupText, hasActiveSession, restoreBackup } from '@/lib/storage/backup';

type Status = { tone: 'success' | 'danger' | 'textSecondary'; text: string } | null;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Sicherung als Datei: ohne Konto ist das der Weg, Daten auf ein neues Handy mitzunehmen.
 * Vor dem Einspielen wird alles geprüft und eine Zusammenfassung zur Bestätigung gezeigt.
 */
export function BackupCard() {
  const theme = useTheme();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function exportBackup() {
    setBusy('export');
    setStatus(null);
    try {
      const now = Date.now();
      await shareBackupFile(backupFileName(now), await exportBackupText(now));
      setStatus({ tone: 'success', text: 'Sicherung erstellt. Bewahre die Datei an einem sicheren Ort auf.' });
    } catch (error) {
      setStatus({ tone: 'danger', text: error instanceof Error ? error.message : 'Die Sicherung ist fehlgeschlagen.' });
    } finally {
      setBusy(null);
    }
  }

  async function importBackup() {
    if (hasActiveSession()) {
      setStatus({ tone: 'danger', text: 'Beende zuerst dein laufendes Workout oder deinen Lauf.' });
      return;
    }
    setBusy('import');
    setStatus(null);
    try {
      const text = await pickBackupText();
      if (text === null) return;
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        setStatus({ tone: 'danger', text: parsed.error });
        return;
      }
      const { summary } = parsed;
      const date = parsed.exportedAt > 0 ? ` vom ${new Date(parsed.exportedAt).toLocaleDateString('de-DE')}` : '';
      confirmAction({
        title: 'Sicherung einspielen?',
        message:
          `Sicherung${date}: ${plural(summary.strength, 'Krafttraining', 'Krafttrainings')}, ` +
          `${plural(summary.home, 'Home-Workout', 'Home-Workouts')}, ${plural(summary.runs, 'Lauf', 'Läufe')}` +
          `${summary.hasPlan ? ' und dein Trainingsplan' : ''}. Die Daten auf diesem Gerät werden dadurch ersetzt.`,
        confirmLabel: 'Einspielen',
        onConfirm: () => {
          void restoreBackup(parsed.entries)
            .then(() => {
              successFeedback();
              setStatus({ tone: 'success', text: 'Willkommen zurück! Deine Daten sind wiederhergestellt.' });
            })
            .catch(() => setStatus({ tone: 'danger', text: 'Die Sicherung konnte nicht eingespielt werden.' }));
        },
      });
    } catch {
      setStatus({ tone: 'danger', text: 'Die Datei konnte nicht gelesen werden.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="cloud-download-outline" size={22} color={theme.accent} />
        <View style={styles.flex}>
          <AppText variant="heading">Datensicherung</AppText>
          <AppText variant="caption" color="textSecondary">
            Ohne Konto liegen deine Daten nur auf diesem Gerät. Sichere sie als Datei, z. B. in iCloud Drive oder Google
            Drive, und spiele sie auf einem neuen Handy wieder ein. Die Datei enthält auch deine Gesundheitsangaben.
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          title="Sichern"
          variant="secondary"
          loading={busy === 'export'}
          disabled={busy !== null}
          onPress={() => void exportBackup()}
          style={styles.flex}
        />
        <Button
          title="Einspielen"
          variant="secondary"
          loading={busy === 'import'}
          disabled={busy !== null}
          onPress={() => void importBackup()}
          style={styles.flex}
        />
      </View>
      {status ? (
        <AppText variant="caption" color={status.tone} accessibilityLiveRegion="polite">
          {status.text}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  head: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
});
