import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Kurzes, spürbares Feedback an den Momenten, die zählen: Satz erledigt, Einheit geschafft, Erfolg.
 * Bewusst sparsam eingesetzt, damit es etwas bedeutet. Im Browser gibt es keine Vibration.
 */
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

function safe(run: () => Promise<void>) {
  if (!supported) return;
  // Fehler (z. B. Gerät ohne Vibrationsmotor) sind egal: Haptik ist nur ein Zusatz
  run().catch(() => undefined);
}

/** Leichter Tipp, z. B. beim Abhaken eines Satzes oder bei einer Auswahl. */
export function tapFeedback() {
  safe(() => Haptics.selectionAsync());
}

/** Spürbarer Impuls, z. B. wenn ein Satz als erledigt markiert wird. */
export function impactFeedback() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Erfolgs-Muster, z. B. am Ende einer Einheit, bei Rekorden und Abzeichen. */
export function successFeedback() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
