import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

/** Bestätigungsdialog: native Alert auf dem Handy, window.confirm im Browser (dort ist Alert wirkungslos). */
export function confirmAction({ title, message, confirmLabel, destructive = true, onConfirm }: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
