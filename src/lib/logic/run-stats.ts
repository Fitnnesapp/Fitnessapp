import type { ActiveRun, KmSplit, RawLocation, RunBests, RunRecordType, TrackPoint } from '../../types/running.ts';

const EARTH_RADIUS_M = 6371008.8;

/** Messungen mit schlechterer Genauigkeit (in Metern) werden verworfen. */
export const MAX_ACCURACY_M = 35;
/** Schneller als das (m/s, entspricht ca. 43 km/h) ist ein Sprung und kein Laufen. */
export const MAX_SPEED_MS = 12;
/** Schritte unter diesem Wert (m) gelten als GPS-Rauschen im Stand. */
export const MIN_STEP_M = 1;
/** Eine Lücke in den Messungen ab dieser aktiven Zeit (s) wird in der Strecke getrennt dargestellt. */
export const GAP_SECONDS = 30;
/** Höhenunterschiede unter diesem Wert (m) zählen nicht als Anstieg. */
export const ELEVATION_THRESHOLD_M = 3;

const toRad = (deg: number) => (deg * Math.PI) / 180;

type Coordinate = { lat: number; lng: number };

/** Entfernung zweier Koordinaten in Metern (Haversine). */
export function haversineM(a: Coordinate, b: Coordinate): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Aktive Laufzeit in ms zum Zeitpunkt `at`. */
export function activeElapsedAt(run: Pick<ActiveRun, 'status' | 'elapsedBase' | 'runningSince'>, at: number): number {
  if (run.status !== 'running' || run.runningSince === null) return run.elapsedBase;
  return run.elapsedBase + Math.max(0, at - run.runningSince);
}

export type StepResult = { accepted: false } | { accepted: true; stepM: number };

/**
 * Prüft, ob ein neuer Punkt übernommen wird, und liefert den zurückgelegten Schritt.
 * Verworfen werden ungenaue Messungen, doppelte oder rückwärts laufende Zeitstempel und unmögliche Sprünge.
 */
export function evaluatePoint(previous: TrackPoint | null, next: TrackPoint): StepResult {
  if (next.acc !== null && next.acc > MAX_ACCURACY_M) return { accepted: false };
  if (!previous) return { accepted: true, stepM: 0 };

  const seconds = (next.t - previous.t) / 1000;
  if (seconds <= 0) return { accepted: false };

  const distance = haversineM(previous, next);
  if (distance / seconds > MAX_SPEED_MS) return { accepted: false };

  return { accepted: true, stepM: distance >= MIN_STEP_M ? distance : 0 };
}

/** Wandelt eine Rohmessung in einen Punkt mit aktiver Zeit, gerundet für kompakten Speicher. */
export function toTrackPoint(raw: RawLocation, elapsedMs: number): TrackPoint {
  return {
    lat: Math.round(raw.lat * 1e6) / 1e6,
    lng: Math.round(raw.lng * 1e6) / 1e6,
    t: raw.t,
    e: Math.max(0, Math.round(elapsedMs)),
    alt: raw.alt === null ? null : Math.round(raw.alt * 10) / 10,
    acc: raw.acc === null ? null : Math.round(raw.acc),
  };
}

/** Gesamtdistanz und kumulierte Distanz je Punkt. Punkte müssen bereits gefiltert sein. */
export function cumulativeDistances(points: TrackPoint[]): { totalM: number; cumulative: number[] } {
  const cumulative: number[] = [];
  let total = 0;

  points.forEach((point, i) => {
    if (i > 0) {
      const step = haversineM(points[i - 1], point);
      if (step >= MIN_STEP_M) total += step;
    }
    cumulative.push(total);
  });

  return { totalM: total, cumulative };
}

/** Teilt die Strecke an Lücken, damit sie nicht quer durch Tunnel oder Funklöcher gezeichnet wird. */
export function splitSegments(points: TrackPoint[], gapSeconds = GAP_SECONDS): TrackPoint[][] {
  const segments: TrackPoint[][] = [];
  let current: TrackPoint[] = [];

  for (const point of points) {
    const last = current[current.length - 1];
    if (last && (point.e - last.e) / 1000 > gapSeconds) {
      segments.push(current);
      current = [];
    }
    current.push(point);
  }
  if (current.length > 0) segments.push(current);

  return segments;
}

/** Summe der Anstiege in Metern. Kleine Schwankungen unter dem Schwellwert werden ignoriert. */
export function elevationGain(points: TrackPoint[], threshold = ELEVATION_THRESHOLD_M): number {
  let reference: number | null = null;
  let gain = 0;

  for (const point of points) {
    if (point.alt === null) continue;
    if (reference === null) {
      reference = point.alt;
      continue;
    }

    const diff = point.alt - reference;
    if (diff >= threshold) {
      gain += diff;
      reference = point.alt;
    } else if (diff <= -threshold) {
      reference = point.alt;
    }
  }

  return Math.round(gain);
}

/** Pace in Sekunden pro Kilometer, null wenn noch zu wenig Strecke vorliegt. */
export function paceSecPerKm(distanceM: number, seconds: number): number | null {
  if (distanceM < 10 || seconds <= 0) return null;
  return seconds / (distanceM / 1000);
}

/** Aktuelle Pace über die letzten `windowSeconds` aktiver Zeit. */
export function currentPace(points: TrackPoint[], windowSeconds = 30): number | null {
  const last = points[points.length - 1];
  if (!last) return null;

  let first = last;
  let distance = 0;
  for (let i = points.length - 2; i >= 0; i--) {
    const earlier = points[i];
    if ((last.e - earlier.e) / 1000 > windowSeconds) break;
    distance += haversineM(earlier, points[i + 1]);
    first = earlier;
  }

  return paceSecPerKm(distance, (last.e - first.e) / 1000);
}

/** Aktive Zeit (s) bei der kumulierten Distanz `target`, zwischen Punkt j-1 und j interpoliert. */
function interpolateSeconds(points: TrackPoint[], cumulative: number[], j: number, target: number): number {
  const before = points[j - 1];
  const after = points[j];
  const span = cumulative[j] - cumulative[j - 1];
  const fraction = span > 0 ? (target - cumulative[j - 1]) / span : 1;
  return (before.e + (after.e - before.e) * Math.min(1, Math.max(0, fraction))) / 1000;
}

/** Zeit (s) für jeden vollständigen Kilometer, mit linearer Interpolation am Kilometerpunkt. */
export function kmSplits(points: TrackPoint[]): KmSplit[] {
  const { totalM, cumulative } = cumulativeDistances(points);
  const splits: KmSplit[] = [];
  let previousSeconds = 0;
  let j = 1;

  for (let km = 1; km * 1000 <= totalM; km++) {
    const target = km * 1000;
    while (j < points.length - 1 && cumulative[j] < target) j++;

    const seconds = interpolateSeconds(points, cumulative, j, target);
    splits.push({ km, seconds: seconds - previousSeconds });
    previousSeconds = seconds;
  }

  return splits;
}

/** Schnellste Zeit (s) für eine zusammenhängende Strecke von `targetM` Metern, null wenn der Lauf kürzer ist. */
export function fastestSplit(points: TrackPoint[], targetM: number): number | null {
  const { totalM, cumulative } = cumulativeDistances(points);
  if (totalM < targetM || points.length < 2) return null;

  let best: number | null = null;
  let j = 1;

  for (let i = 0; i < points.length - 1; i++) {
    const target = cumulative[i] + targetM;
    if (target > totalM) break;

    while (j < points.length - 1 && cumulative[j] < target) j++;
    const seconds = interpolateSeconds(points, cumulative, j, target) - points[i].e / 1000;
    if (seconds > 0 && (best === null || seconds < best)) best = seconds;
  }

  return best;
}

export function computeBests(points: TrackPoint[]): RunBests {
  return { k1: fastestSplit(points, 1000), k5: fastestSplit(points, 5000), k10: fastestSplit(points, 10000) };
}

type RunLike = { id: string; distanceM: number; bests: RunBests };

/**
 * Findet Läufe, die einen persönlichen Rekord brechen. Erwartet die Läufe zeitlich aufsteigend.
 * Gleicher Wert ist kein Rekord. Der erste Lauf je Kategorie legt nur die Basis fest.
 */
export function findRunRecords(runs: RunLike[]): Map<string, RunRecordType[]> {
  const records = new Map<string, RunRecordType[]>();
  let longest: number | undefined;
  const fastest: Record<'k1' | 'k5' | 'k10', number | undefined> = { k1: undefined, k5: undefined, k10: undefined };
  const labels = { k1: 'fastest_1k', k5: 'fastest_5k', k10: 'fastest_10k' } as const;

  for (const run of runs) {
    const types: RunRecordType[] = [];

    if (longest !== undefined && run.distanceM > longest) types.push('longest_distance');
    if (longest === undefined || run.distanceM > longest) longest = run.distanceM;

    for (const key of ['k1', 'k5', 'k10'] as const) {
      const seconds = run.bests[key];
      if (seconds === null) continue;

      const previous = fastest[key];
      if (previous !== undefined && seconds < previous) types.push(labels[key]);
      if (previous === undefined || seconds < previous) fastest[key] = seconds;
    }

    if (types.length > 0) records.set(run.id, types);
  }

  return records;
}

/** Reduziert die Punktzahl für die Darstellung, behält Anfang und Ende. */
export function downsample<T>(items: T[], max: number): T[] {
  if (items.length <= max || max < 2) return items;

  const result: T[] = [];
  const step = (items.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) result.push(items[Math.round(i * step)]);
  return result;
}
