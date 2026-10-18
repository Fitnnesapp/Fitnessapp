import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { useRunStore } from '@/lib/storage/run-store';

import { RUN_TASK } from './background-task';
import { toRawLocation } from './convert';

export type PermissionResult = 'granted' | 'denied';
export type TrackingMode = 'background' | 'foreground';

let watchSubscription: Location.LocationSubscription | null = null;
let mode: TrackingMode | null = null;

// Kompromiss aus Genauigkeit und Akkuverbrauch: ein Punkt etwa alle 2 Sekunden oder 5 Meter.
// Höhere Genauigkeit oder dichtere Intervalle kosten spürbar mehr Akku, ohne die Distanz merklich zu verbessern.
const OPTIONS = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 2000,
  distanceInterval: 5,
} as const;

/** Fragt die Standortberechtigung an. Für Hintergrund-Tracking wird zusätzlich "Immer" angefragt, falls möglich. */
export async function requestTrackingPermission(): Promise<PermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return 'denied';

  if (Platform.OS !== 'web') {
    // Ohne "Immer erlauben" läuft das Tracking nur, solange die App im Vordergrund ist
    await Location.requestBackgroundPermissionsAsync().catch(() => undefined);
  }
  return 'granted';
}

export async function hasForegroundPermission(): Promise<boolean> {
  return (await Location.getForegroundPermissionsAsync()).granted;
}

async function startBackground(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const background = await Location.getBackgroundPermissionsAsync();
  if (!background.granted) return false;

  try {
    await Location.startLocationUpdatesAsync(RUN_TASK, {
      ...OPTIONS,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      // Android: Vordergrunddienst mit Benachrichtigung hält die Aufzeichnung bei gesperrtem Bildschirm am Leben
      foregroundService: {
        notificationTitle: 'Lauf läuft',
        notificationBody: 'Deine Strecke wird aufgezeichnet.',
      },
    });
    return true;
  } catch {
    // z.B. in Expo Go, wo Hintergrund-Standort nicht verfügbar ist
    return false;
  }
}

/** Startet die Aufzeichnung. Bevorzugt im Hintergrund, sonst als Fallback nur im Vordergrund. */
export async function startTracking(): Promise<TrackingMode> {
  if (mode) return mode;

  if (await startBackground()) {
    mode = 'background';
    return mode;
  }

  watchSubscription = await Location.watchPositionAsync(OPTIONS, (location) => {
    useRunStore.getState().addLocations([toRawLocation(location)]);
  });
  mode = 'foreground';
  return mode;
}

/** Stellt die Aufzeichnung wieder her, z.B. nach einem App-Neustart mitten im Lauf. */
export async function ensureTracking(): Promise<TrackingMode> {
  if (mode) return mode;

  if (Platform.OS !== 'web' && (await Location.hasStartedLocationUpdatesAsync(RUN_TASK).catch(() => false))) {
    mode = 'background';
    return mode;
  }
  return startTracking();
}

export async function stopTracking(): Promise<void> {
  watchSubscription?.remove();
  watchSubscription = null;

  if (Platform.OS !== 'web' && (await Location.hasStartedLocationUpdatesAsync(RUN_TASK).catch(() => false))) {
    await Location.stopLocationUpdatesAsync(RUN_TASK).catch(() => undefined);
  }
  mode = null;
}
