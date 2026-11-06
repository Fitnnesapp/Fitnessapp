import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { HealthExport, HealthWorkoutKind } from '@/lib/logic/health-export';

type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');

let cached: HealthKitModule | null | undefined;

/**
 * HealthKit nur im installierten iPhone-Build laden. Im Browser, auf Android und in Expo Go fehlt
 * das native Modul; ein direkter Import würde dort beim Start abstürzen.
 */
function healthKit(): HealthKitModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== 'ios' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('@kingstinct/react-native-healthkit') as HealthKitModule;
    cached = module.isHealthDataAvailable() ? module : null;
  } catch {
    cached = null;
  }
  return cached;
}

export type AppleHealthAvailability = 'available' | 'not-ios' | 'needs-app-build';

export function appleHealthAvailability(): AppleHealthAvailability {
  if (Platform.OS !== 'ios') return 'not-ios';
  return healthKit() ? 'available' : 'needs-app-build';
}

const SHARE_TYPES = [
  'HKWorkoutTypeIdentifier',
  'HKWorkoutRouteTypeIdentifier',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierDistanceCycling',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
] as const;

/** Fragt die Schreibrechte an (Apple zeigt dafür seinen eigenen Dialog). */
export async function requestAppleHealthAccess(): Promise<boolean> {
  const hk = healthKit();
  if (!hk) return false;
  try {
    return await hk.requestAuthorization({ toShare: SHARE_TYPES });
  } catch {
    return false;
  }
}

function activityType(hk: HealthKitModule, kind: HealthWorkoutKind) {
  const types = hk.WorkoutActivityType;
  switch (kind) {
    case 'running':
      return types.running;
    case 'cycling':
      return types.cycling;
    case 'traditionalStrengthTraining':
      return types.traditionalStrengthTraining;
    case 'highIntensityIntervalTraining':
      return types.highIntensityIntervalTraining;
    case 'coreTraining':
      return types.coreTraining;
    case 'flexibility':
      return types.flexibility;
    case 'functionalStrengthTraining':
      return types.functionalStrengthTraining;
  }
}

/**
 * Schreibt eine Einheit als Workout nach Apple Health, bei GPS-Einheiten mit Strecke.
 * Die eigene ID steht als externe Kennung in den Metadaten.
 */
export async function writeToAppleHealth(entry: HealthExport): Promise<boolean> {
  const hk = healthKit();
  if (!hk) return false;
  const workout = await hk.saveWorkoutSample(
    activityType(hk, entry.kind),
    [],
    new Date(entry.start),
    new Date(entry.end),
    { distance: entry.distanceM, energyBurned: entry.energyKcal },
    { HKExternalUUID: entry.id },
  );
  const route = entry.route.filter((point) => point.acc === null || point.acc <= 50);
  if (route.length >= 2) {
    try {
      await workout.saveWorkoutRoute(
        route.map((point) => ({
          latitude: point.lat,
          longitude: point.lng,
          altitude: point.alt ?? 0,
          date: new Date(point.t),
          horizontalAccuracy: point.acc ?? 10,
          verticalAccuracy: point.alt === null ? -1 : 10,
          course: -1,
          speed: -1,
        })),
      );
    } catch {
      // Die Strecke ist eine Zugabe: das Workout selbst ist gespeichert
    }
  }
  return true;
}
