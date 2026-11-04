import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { useConfirmStore } from '@/lib/confirm';

/** Zeigt die aktuelle Rückfrage aus confirmAction als Dialog im App-Design. Einmal im Root-Layout eingebunden. */
export function ConfirmHost() {
  const theme = useTheme();
  const request = useConfirmStore((state) => state.request);
  const close = useConfirmStore((state) => state.close);

  function cancel() {
    const onCancel = request?.onCancel;
    close();
    onCancel?.();
  }

  function confirm() {
    const onConfirm = request?.onConfirm;
    close();
    tapFeedback();
    onConfirm?.();
  }

  return (
    <Modal visible={request !== null} transparent animationType="fade" onRequestClose={cancel}>
      <Pressable style={styles.backdrop} onPress={cancel} accessibilityLabel="Abbrechen">
        <Pressable
          style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityRole="alert"
          // Tippen im Dialog schließt ihn nicht
          onPress={() => undefined}>
          <AppText variant="title">{request?.title}</AppText>
          <AppText color="textSecondary">{request?.message}</AppText>
          <View style={styles.actions}>
            <Button title="Abbrechen" variant="secondary" onPress={cancel} style={styles.flex} />
            <Button
              title={request?.confirmLabel ?? 'OK'}
              variant={request?.destructive ? 'danger' : 'primary'}
              onPress={confirm}
              style={styles.flex}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  dialog: {
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.five,
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  flex: { flex: 1 },
});
