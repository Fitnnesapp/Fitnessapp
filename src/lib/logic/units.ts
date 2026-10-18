export type Units = 'metric' | 'imperial';

const LB_PER_KG = 2.2046226218;

export function weightUnitLabel(units: Units): string {
  return units === 'metric' ? 'kg' : 'lb';
}

/** Rundet auf zwei Nachkommastellen, damit Hin- und Rückrechnung keine Artefakte zeigt. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function kgToDisplay(kg: number, units: Units): number {
  return units === 'metric' ? kg : round2(kg * LB_PER_KG);
}

export function displayToKg(value: number, units: Units): number {
  return units === 'metric' ? value : round2(value / LB_PER_KG);
}

/** Liest Eingaben wie "7,5" oder "7.5"; leere oder ungültige Eingaben ergeben null. */
export function parseNumber(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function formatWeight(kg: number, units: Units): string {
  const value = kgToDisplay(kg, units);
  const text = Number.isInteger(value) ? String(value) : String(round2(value)).replace('.', ',');
  return `${text} ${weightUnitLabel(units)}`;
}

const M_PER_MILE = 1609.344;

/** Distanz in km bzw. Meilen mit zwei Nachkommastellen. */
export function formatDistance(meters: number, units: Units): string {
  const value = units === 'metric' ? meters / 1000 : meters / M_PER_MILE;
  return `${value.toFixed(2).replace('.', ',')} ${units === 'metric' ? 'km' : 'mi'}`;
}

/** Pace als m:ss pro km bzw. Meile. null ergibt einen Platzhalter. */
export function formatPace(secPerKm: number | null, units: Units): string {
  if (secPerKm === null || !Number.isFinite(secPerKm)) return '–:––';
  const seconds = Math.round(units === 'metric' ? secPerKm : secPerKm * (M_PER_MILE / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export const paceUnitLabel = (units: Units) => (units === 'metric' ? 'min/km' : 'min/mi');

export function formatElevation(meters: number, units: Units): string {
  return units === 'metric' ? `${meters} m` : `${Math.round(meters * 3.28084)} ft`;
}
