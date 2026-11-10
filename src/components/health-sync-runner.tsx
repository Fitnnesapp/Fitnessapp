import { useEffect, useRef } from 'react';

import { getProgram } from '@/data/programs';
import { appleHealthAvailability, writeToAppleHealth } from '@/lib/health/apple-health';
import { pendingHealthExports } from '@/lib/logic/health-export';
import { useHealthSync } from '@/lib/storage/health-sync-store';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useWorkouts } from '@/lib/storage/workout-store';

/**
 * Überträgt neue Einheiten im Hintergrund nach Apple Health, sobald die Verbindung an ist.
 * Unsichtbar; läuft nur im installierten iPhone-Build, sonst passiert nichts.
 */
export function HealthSyncRunner() {
  const connectedAt = useHealthSync((state) => state.connectedAt);
  const hydrated = useHealthSync((state) => state.hydrated);
  const strength = useWorkouts((state) => state.history);
  const home = useHomeSessions((state) => state.sessions);
  const gps = useRunStore((state) => state.history);
  const running = useRef(false);

  useEffect(() => {
    if (!hydrated || connectedAt === null || running.current) return;
    if (appleHealthAvailability() !== 'available') return;

    const { exported, markExported, setError } = useHealthSync.getState();
    const pending = pendingHealthExports(
      {
        strength,
        home: home.map((s) => ({ ...s, category: getProgram(s.programId)?.category })),
        gps,
      },
      exported,
      connectedAt,
    );
    if (pending.length === 0) return;

    running.current = true;
    void (async () => {
      try {
        for (const entry of pending) {
          if (await writeToAppleHealth(entry)) markExported(entry.id, Date.now());
        }
      } catch {
        setError('Übertragung nach Apple Health fehlgeschlagen. Prüfe die Freigaben in der Health-App.');
      } finally {
        running.current = false;
      }
    })();
  }, [hydrated, connectedAt, strength, home, gps]);

  return null;
}
