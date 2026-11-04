/**
 * Datensicherung ohne Konto und ohne Server: alle Trainingsdaten als eine JSON-Datei,
 * die du selbst aufbewahrst (z.B. in iCloud Drive oder Google Drive) und auf einem
 * neuen Gerät wieder einspielst.
 *
 * Nicht enthalten: der Kaufstatus (kommt immer vom App Store) und zwischengespeicherte Events.
 */

export const BACKUP_APP = 'fitnessapp';
export const BACKUP_FORMAT = 1;
/** Schutz vor versehentlich gewählten Riesendateien */
export const MAX_BACKUP_CHARS = 25_000_000;

export const BACKUP_KEYS = [
  'fitnessapp-settings',
  'fitnessapp-workouts',
  'fitnessapp-home',
  'fitnessapp-runs',
  'fitnessapp-gamification',
  'fitnessapp-plan',
  'fitnessapp-challenges',
  'fitnessapp-health',
] as const;

export type BackupKey = (typeof BACKUP_KEYS)[number];

/** Gespeicherter Zustand eines Stores, wie ihn zustand/persist ablegt. */
type PersistedValue = { state: Record<string, unknown>; version?: number };

export type BackupSummary = { strength: number; home: number; runs: number; hasPlan: boolean };

export type ParsedBackup =
  | { ok: true; exportedAt: number; entries: [BackupKey, string][]; summary: BackupSummary }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPersisted(value: unknown): value is PersistedValue {
  return isObject(value) && isObject(value.state) && (value.version === undefined || typeof value.version === 'number');
}

function count(value: PersistedValue | undefined, field: string): number {
  const list = value?.state[field];
  return Array.isArray(list) ? list.length : 0;
}

/** Erstellt den Inhalt der Sicherungsdatei aus den gespeicherten Rohwerten (Schlüssel → JSON-Text). */
export function createBackup(raw: Partial<Record<string, string | null>>, now: number): string {
  const data: Record<string, unknown> = {};
  for (const key of BACKUP_KEYS) {
    const text = raw[key];
    if (!text) continue;
    try {
      const value: unknown = JSON.parse(text);
      if (isPersisted(value)) data[key] = value;
    } catch {
      // Beschädigte Einträge werden ausgelassen statt die ganze Sicherung zu verhindern
    }
  }
  return JSON.stringify({ app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt: now, data });
}

/** Prüft eine Sicherungsdatei vollständig, bevor irgendetwas überschrieben wird. */
export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_CHARS) return { ok: false, error: 'Die Datei ist zu groß für eine Sicherung dieser App.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist keine gültige Sicherung (kein JSON).' };
  }
  if (!isObject(parsed) || parsed.app !== BACKUP_APP) {
    return { ok: false, error: 'Diese Datei stammt nicht aus dieser App.' };
  }
  if (typeof parsed.format !== 'number' || parsed.format > BACKUP_FORMAT) {
    return { ok: false, error: 'Diese Sicherung ist neuer als die App. Bitte aktualisiere zuerst die App.' };
  }
  if (!isObject(parsed.data)) return { ok: false, error: 'Die Sicherung enthält keine Daten.' };

  const values = new Map<BackupKey, PersistedValue>();
  for (const key of BACKUP_KEYS) {
    const value = parsed.data[key];
    if (value === undefined) continue;
    if (!isPersisted(value)) return { ok: false, error: 'Die Sicherung ist beschädigt.' };
    values.set(key, value);
  }
  if (values.size === 0) return { ok: false, error: 'Die Sicherung enthält keine Daten.' };

  const entries: [BackupKey, string][] = [...values.entries()].map(([key, value]) => {
    // Laufende Workouts oder Läufe werden nie wiederhergestellt, nur Abgeschlossenes
    const state = key === 'fitnessapp-workouts' || key === 'fitnessapp-runs' ? { ...value.state, active: null } : value.state;
    return [key, JSON.stringify({ state, version: value.version ?? 0 })];
  });

  const plan = values.get('fitnessapp-plan');
  return {
    ok: true,
    exportedAt: typeof parsed.exportedAt === 'number' ? parsed.exportedAt : 0,
    entries,
    summary: {
      strength: count(values.get('fitnessapp-workouts'), 'history'),
      home: count(values.get('fitnessapp-home'), 'sessions'),
      runs: count(values.get('fitnessapp-runs'), 'history'),
      hasPlan: isObject(plan?.state.plan),
    },
  };
}

/** Dateiname mit Datum, z.B. fitnessapp-sicherung-2026-11-04.json */
export function backupFileName(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `fitnessapp-sicherung-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
