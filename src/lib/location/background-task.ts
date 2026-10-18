import type { LocationObject } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { useRunStore } from '@/lib/storage/run-store';

import { toRawLocation } from './convert';

export const RUN_TASK = 'fitnessapp-run-location';

// Muss beim App-Start im globalen Scope laufen, damit das Betriebssystem die Aufgabe auch im Hintergrund
// (bei gesperrtem Bildschirm) ausführen kann. Wird deshalb im Root-Layout importiert.
TaskManager.defineTask<{ locations: LocationObject[] }>(RUN_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;

  // Im Hintergrund startet die App ggf. ohne geladenen Speicher
  if (!useRunStore.getState().hydrated) await useRunStore.persist.rehydrate();

  useRunStore.getState().addLocations(data.locations.map(toRawLocation));
});
