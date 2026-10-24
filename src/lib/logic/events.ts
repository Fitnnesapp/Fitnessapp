/**
 * Angekündigte Events (große Läufe, Fitness-Wettkämpfe).
 * Die Liste kommt aus dem Internet und gilt deshalb als nicht vertrauenswürdig:
 * Jeder Eintrag wird geprüft, Ungültiges wird verworfen.
 */

export type EventKind = 'lauf' | 'fitness';

export type FitnessEvent = {
  id: string;
  name: string;
  kind: EventKind;
  /** Erster Tag, yyyy-mm-dd */
  date: string;
  /** Letzter Tag bei mehrtägigen Events */
  endDate?: string;
  city: string;
  country: string;
  distances: string[];
  /** Nur https-Links */
  url: string;
  description: string;
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_EVENTS = 200;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

function isValidDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function safeUrl(value: unknown): string | null {
  const raw = text(value, 300);
  if (!raw || !raw.startsWith('https://')) return null;
  return /\s/.test(raw) ? null : raw;
}

/** Prüft die geladene Liste. Gibt null zurück, wenn das Format nicht stimmt. */
export function parseEvents(data: unknown): FitnessEvent[] | null {
  if (!data || typeof data !== 'object' || !Array.isArray((data as { events?: unknown }).events)) return null;

  const result: FitnessEvent[] = [];
  const seen = new Set<string>();
  for (const raw of (data as { events: unknown[] }).events.slice(0, MAX_EVENTS)) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Record<string, unknown>;
    const id = text(e.id, 80);
    const name = text(e.name, 80);
    const date = text(e.date, 10);
    const city = text(e.city, 60);
    const country = text(e.country, 3);
    const url = safeUrl(e.url);
    const kind = e.kind === 'lauf' || e.kind === 'fitness' ? e.kind : null;
    if (!id || !name || !date || !isValidDay(date) || !city || !country || !url || !kind || seen.has(id)) continue;

    const endDate = typeof e.endDate === 'string' && isValidDay(e.endDate) && e.endDate >= date ? e.endDate : undefined;
    const distances = Array.isArray(e.distances)
      ? e.distances.map((d) => text(d, 40)).filter((d): d is string => d !== null).slice(0, 6)
      : [];
    seen.add(id);
    result.push({
      id,
      name,
      kind,
      date,
      endDate,
      city,
      country,
      distances,
      url,
      description: text(e.description, 240) ?? '',
    });
  }
  return result;
}

function dayStart(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function todayStart(now: number): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Tage bis zum Event: 0 = heute (oder läuft gerade). */
export function daysUntilEvent(event: FitnessEvent, now: number): number {
  return Math.max(0, Math.round((dayStart(event.date) - todayStart(now)) / 86400000));
}

/** Kommende und laufende Events, das nächste zuerst. */
export function upcomingEvents(events: FitnessEvent[], now: number, limit = 50): FitnessEvent[] {
  const today = todayStart(now);
  return events
    .filter((e) => dayStart(e.endDate ?? e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** "Heute", "Morgen", "In 5 Tagen", "In 3 Wochen" */
export function countdownLabel(event: FitnessEvent, now: number): string {
  const days = daysUntilEvent(event, now);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days < 21) return `In ${days} Tagen`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `In ${weeks} Wochen`;
  return `In ${Math.round(days / 30)} Monaten`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Datum für das Kalenderblatt: Tag und Monat. */
export function dateBadge(event: FitnessEvent): { day: string; month: string } {
  const [, m, d] = event.date.split('-').map(Number);
  return { day: String(d), month: MONTHS_SHORT[m - 1] };
}
