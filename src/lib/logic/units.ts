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
