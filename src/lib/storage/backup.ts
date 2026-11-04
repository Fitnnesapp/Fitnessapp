import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKUP_KEYS, createBackup, type BackupKey } from '@/lib/logic/backup';

import { useChallengeStore } from './challenge-store';
import { flushPendingWrites } from './debounced-storage';
import { useGamification } from './gamification-store';
import { useGoalsStore } from './goals-store';
import { useHealthStore } from './health-store';
import { useHomeSessions } from './home-store';
import { usePlanStore } from './plan-store';
import { useRunStore } from './run-store';
import { useSettings } from './settings-store';
import { useWorkouts } from './workout-store';

/** Liest alle gesicherten Bereiche und erstellt den Text der Sicherungsdatei. */
export async function exportBackupText(now = Date.now()): Promise<string> {
  await flushPendingWrites();
  const pairs = await AsyncStorage.multiGet([...BACKUP_KEYS]);
  return createBackup(Object.fromEntries(pairs), now);
}

/** true, wenn gerade ein Workout oder Lauf läuft. Dann wird nichts wiederhergestellt. */
export function hasActiveSession(): boolean {
  return useWorkouts.getState().active !== null || useRunStore.getState().active !== null;
}

/**
 * Schreibt geprüfte Einträge (aus parseBackup) und lädt alle Stores neu.
 * Beim Neuladen laufen die normalen Migrationen, ältere Sicherungen bleiben also lesbar.
 */
export async function restoreBackup(entries: [BackupKey, string][]): Promise<void> {
  await flushPendingWrites();
  await AsyncStorage.multiSet(entries);
  await Promise.all([
    useSettings.persist.rehydrate(),
    useWorkouts.persist.rehydrate(),
    useHomeSessions.persist.rehydrate(),
    useRunStore.persist.rehydrate(),
    useGamification.persist.rehydrate(),
    usePlanStore.persist.rehydrate(),
    useChallengeStore.persist.rehydrate(),
    useHealthStore.persist.rehydrate(),
    useGoalsStore.persist.rehydrate(),
  ]);
}
