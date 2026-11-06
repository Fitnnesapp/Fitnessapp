/**
 * Abbildung der eigenen Einheiten auf Apple-Health-Workouts. Rein und testbar; das Schreiben selbst
 * übernimmt src/lib/health/apple-health.ts. Duplikate verhindert die Liste bereits exportierter IDs.
 */

export type HealthWorkoutKind =
  | 'running'
  | 'cycling'
  | 'traditionalStrengthTraining'
  | 'highIntensityIntervalTraining'
  | 'coreTraining'
  | 'flexibility'
  | 'functionalStrengthTraining';

export type HealthRoutePoint = { lat: number; lng: number; t: number; alt: number | null; acc: number | null };

export type HealthExport = {
  /** Eigene ID, steht auch als Kennung in den Metadaten */
  id: string;
  kind: HealthWorkoutKind;
  start: number;
  end: number;
  distanceM?: number;
  energyKcal?: number;
  route: HealthRoutePoint[];
};

type StrengthLike = { id: string; startedAt: number; endedAt: number };
type HomeLike = {
  id: string;
  startedAt: number;
  endedAt: number;
  category: 'HIIT' | 'Core' | 'Mobility' | 'Ganzkörper' | undefined;
  caloriesEstimate: number;
};
type GpsLike = {
  id: string;
  startedAt: number;
  endedAt: number;
  distanceM: number;
  sport?: 'run' | 'ride';
  points: HealthRoutePoint[];
};

const HOME_KIND: Record<NonNullable<HomeLike['category']>, HealthWorkoutKind> = {
  HIIT: 'highIntensityIntervalTraining',
  Core: 'coreTraining',
  Mobility: 'flexibility',
  Ganzkörper: 'functionalStrengthTraining',
};

/** Alle Einheiten, die noch nicht in Apple Health stehen, ältere zuerst. */
export function pendingHealthExports(
  sources: { strength: readonly StrengthLike[]; home: readonly HomeLike[]; gps: readonly GpsLike[] },
  exported: Readonly<Record<string, number>>,
  since: number,
): HealthExport[] {
  const all: HealthExport[] = [
    ...sources.strength.map((w) => ({
      id: w.id,
      kind: 'traditionalStrengthTraining' as const,
      start: w.startedAt,
      end: w.endedAt,
      route: [],
    })),
    ...sources.home.map((s) => ({
      id: s.id,
      kind: s.category ? HOME_KIND[s.category] : ('functionalStrengthTraining' as const),
      start: s.startedAt,
      end: s.endedAt,
      energyKcal: s.caloriesEstimate > 0 ? s.caloriesEstimate : undefined,
      route: [],
    })),
    ...sources.gps.map((r) => ({
      id: r.id,
      kind: r.sport === 'ride' ? ('cycling' as const) : ('running' as const),
      start: r.startedAt,
      end: r.endedAt,
      distanceM: r.distanceM > 0 ? r.distanceM : undefined,
      route: r.points,
    })),
  ];
  return (
    all
      // Nur Einheiten ab dem Verbinden, sonst würde beim ersten Mal der ganze Verlauf doppelt neben
      // eventuell schon vorhandenen Daten anderer Apps landen
      .filter((entry) => entry.start >= since && entry.end > entry.start && exported[entry.id] === undefined)
      .sort((a, b) => a.start - b.start)
  );
}
