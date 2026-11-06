/**
 * Gesundheits-Nutzen einer Woche nach den WHO-Empfehlungen (2020) für Erwachsene:
 * mindestens 150 Minuten moderate oder 75 Minuten intensive Ausdaueraktivität
 * (eine intensive Minute zählt wie zwei moderate) und an mindestens 2 Tagen Krafttraining.
 *
 * Bewusst vorsichtig gerechnet: Krafttraining zählt nur für die Krafttage, nicht für die Ausdauerminuten,
 * Mobility zählt für keins von beidem.
 */

export const WHO_AEROBIC_MINUTES = 150;
export const WHO_STRENGTH_DAYS = 2;

export type Intensity = 'intensiv' | 'moderat' | 'keine';

export type BenefitEntry = {
  startedAt: number;
  durationSeconds: number;
  /** Ausdauer-Intensität der Einheit */
  intensity: Intensity;
  /** Kräftigt die großen Muskelgruppen (Kraft-Workout, Ganzkörper- oder Core-Programm) */
  strengthening: boolean;
};

export type WeeklyBenefit = {
  /** Ausdauerminuten in moderaten Minuten gerechnet (intensiv doppelt) */
  aerobicMinutes: number;
  /** Verschiedene Kalendertage mit Krafttraining */
  strengthDays: number;
  aerobicMet: boolean;
  strengthMet: boolean;
};

const dayKey = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function weeklyBenefit(entries: readonly BenefitEntry[], weekStartAt: number): WeeklyBenefit {
  const weekEnd = weekStartAt + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000; // Puffer für Zeitumstellung
  let aerobic = 0;
  const strengthDays = new Set<string>();
  for (const entry of entries) {
    if (entry.startedAt < weekStartAt || entry.startedAt >= weekEnd) continue;
    const minutes = Math.max(0, entry.durationSeconds) / 60;
    if (entry.intensity === 'intensiv') aerobic += minutes * 2;
    else if (entry.intensity === 'moderat') aerobic += minutes;
    if (entry.strengthening) strengthDays.add(dayKey(entry.startedAt));
  }
  const aerobicMinutes = Math.round(aerobic);
  return {
    aerobicMinutes,
    strengthDays: strengthDays.size,
    aerobicMet: aerobicMinutes >= WHO_AEROBIC_MINUTES,
    strengthMet: strengthDays.size >= WHO_STRENGTH_DAYS,
  };
}

/** Intensität eines Laufs oder einer Radfahrt aus dem Tempo. */
export function enduranceIntensity(sport: 'run' | 'ride', distanceM: number, durationSeconds: number): Intensity {
  if (durationSeconds <= 0) return 'keine';
  if (sport === 'run') return 'intensiv'; // Laufen liegt praktisch immer über 6 MET
  const kmh = distanceM / 1000 / (durationSeconds / 3600);
  // Radfahren ab etwa 20 km/h gilt als intensiv, darunter als moderat
  return kmh >= 20 ? 'intensiv' : 'moderat';
}

/** Kurzer, positiv formulierter Satz: was schon erreicht ist und was am einfachsten fehlt. */
export function benefitMessage(benefit: WeeklyBenefit): string {
  if (benefit.aerobicMet && benefit.strengthMet) {
    return 'Du erfüllst diese Woche beide WHO-Empfehlungen. Genau dieses Pensum hängt in großen Studien am stärksten mit einem längeren, gesünderen Leben zusammen.';
  }
  const missingMinutes = Math.max(0, WHO_AEROBIC_MINUTES - benefit.aerobicMinutes);
  const missingDays = Math.max(0, WHO_STRENGTH_DAYS - benefit.strengthDays);
  const parts: string[] = [];
  if (missingMinutes > 0) {
    // Ein Lauf zählt doppelt: halbe Zeit reicht
    const runMinutes = Math.ceil(missingMinutes / 2 / 5) * 5;
    parts.push(`noch ${missingMinutes} Ausdauerminuten (z.B. ${runMinutes} Min. lockeres Laufen)`);
  }
  if (missingDays > 0) parts.push(missingDays === 1 ? 'noch ein Krafttag' : `noch ${missingDays} Krafttage`);
  return `Bis zur WHO-Empfehlung fehlen ${parts.join(' und ')}.`;
}

/** In wie vielen der letzten vollen Wochen beide Empfehlungen erfüllt waren (aktuelle Woche zählt nicht). */
export function weeksMet(entries: readonly BenefitEntry[], currentWeekStart: number, weeks = 12): number {
  let count = 0;
  let start = currentWeekStart;
  for (let i = 0; i < weeks; i++) {
    // Vorwoche: Montag vor dem aktuellen Wochenbeginn, zeitumstellungssicher über das Kalenderdatum
    const d = new Date(start);
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7).getTime();
    const week = weeklyBenefit(entries, start);
    if (week.aerobicMet && week.strengthMet) count += 1;
  }
  return count;
}
