/** Sprachansagen während Lauf und Radfahrt: nach jedem Kilometer (Rad: alle 5) Zeit und Tempo. */

export type AnnounceUnits = 'metric' | 'imperial';

const M_PER_MILE = 1609.344;

export function unitLengthM(units: AnnounceUnits): number {
  return units === 'metric' ? 1000 : M_PER_MILE;
}

/** Abstand der Ansagen in Einheiten: Laufen jede, Radfahren jede fünfte. */
export function announceEvery(sport: 'run' | 'ride'): number {
  return sport === 'ride' ? 5 : 1;
}

/** Welche Marke (z.B. 3 für 3 km) zwischen zwei Distanzen überschritten wurde, sonst null. */
export function crossedMark(previousM: number, nextM: number, unitM: number, every: number): number | null {
  const step = unitM * every;
  const before = Math.floor(previousM / step);
  const after = Math.floor(nextM / step);
  return after > before && after > 0 ? after * every : null;
}

/** Dauer zum Vorlesen: "1 Stunde 5 Minuten", "5 Minuten 12", "45 Sekunden". */
export function spokenDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours} ${hours === 1 ? 'Stunde' : 'Stunden'} ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`;
  if (minutes === 0) return `${seconds} Sekunden`;
  return seconds === 0 ? `${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}` : `${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'} ${seconds}`;
}

export function announcementText(input: {
  mark: number;
  sport: 'run' | 'ride';
  units: AnnounceUnits;
  elapsedSeconds: number;
  /** Zeit für das letzte Teilstück (1 Einheit beim Laufen, 5 beim Rad) */
  segmentSeconds: number;
}): string {
  const unitName = input.units === 'metric' ? 'Kilometer' : input.mark === 1 ? 'Meile' : 'Meilen';
  const head = `${input.mark} ${unitName}. Zeit ${spokenDuration(input.elapsedSeconds)}.`;
  if (input.sport === 'ride') {
    const every = announceEvery('ride');
    const perHour = input.segmentSeconds > 0 ? Math.round((every / input.segmentSeconds) * 3600) : 0;
    return `${head} Tempo zuletzt ${perHour} ${input.units === 'metric' ? 'Kilometer' : 'Meilen'} pro Stunde.`;
  }
  return `${head} Letzter ${input.units === 'metric' ? 'Kilometer' : 'Meile'} in ${spokenDuration(input.segmentSeconds)}.`;
}
