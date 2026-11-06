import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';

import { announceEvery, announcementText, crossedMark, paceDelta, paceDeltaSpoken, unitLengthM } from '@/lib/logic/announce';
import { useSettings } from '@/lib/storage/settings-store';

/**
 * Sagt während der Aufzeichnung nach jedem Kilometer (Rad: alle 5) Zeit und Tempo an.
 * Läuft, solange die Aufzeichnung offen ist; die Musik wird dabei nur kurz leiser.
 */
export function useVoiceSplits(input: { distanceM: number; elapsedMs: number; sport: 'run' | 'ride'; active: boolean }) {
  const enabled = useSettings((state) => state.voiceSplits);
  const units = useSettings((state) => state.units);
  const target = useSettings((state) => state.targetPaceSecPerKm);
  const previous = useRef<{ distanceM: number; markElapsedMs: number | null } | null>(null);

  useEffect(() => {
    if (!input.active) {
      previous.current = null;
      return;
    }
    const last = previous.current;
    previous.current = { distanceM: input.distanceM, markElapsedMs: last?.markElapsedMs ?? null };
    if (!enabled || !last) return;

    const every = announceEvery(input.sport);
    const mark = crossedMark(last.distanceM, input.distanceM, unitLengthM(units), every);
    if (mark === null) return;

    // Teilstück seit der letzten Ansage; nach einem Neustart der Seite der Durchschnitt bis hier
    const segmentMs =
      last.markElapsedMs !== null ? input.elapsedMs - last.markElapsedMs : input.elapsedMs / (mark / every);
    previous.current = { distanceM: input.distanceM, markElapsedMs: input.elapsedMs };
    Speech.stop().catch(() => undefined);
    // Beim Laufen mit Zieltempo: Abweichung des Durchschnitts mit ansagen
    const avgPace = input.distanceM > 0 ? input.elapsedMs / 1000 / (input.distanceM / 1000) : null;
    const extra = input.sport === 'run' ? paceDeltaSpoken(paceDelta(avgPace, target)) : '';
    Speech.speak(
      announcementText({
        mark,
        sport: input.sport,
        units,
        elapsedSeconds: input.elapsedMs / 1000,
        segmentSeconds: segmentMs / 1000,
      }) + extra,
      { language: 'de-DE', rate: 1.0 },
    );
  }, [enabled, units, target, input.active, input.distanceM, input.elapsedMs, input.sport]);
}
