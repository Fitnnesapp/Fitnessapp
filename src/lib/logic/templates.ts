/** Reine Listenoperationen für Vorlagen, damit der Editor testbar bleibt. */

export const TEMPLATE_MAX_EXERCISES = 20;

/** Hängt eine Übung an; doppelte Einträge und mehr als 20 Übungen werden ignoriert. */
export function addToTemplate(ids: readonly string[], id: string): string[] {
  if (ids.includes(id) || ids.length >= TEMPLATE_MAX_EXERCISES) return [...ids];
  return [...ids, id];
}

export function removeFromTemplate(ids: readonly string[], index: number): string[] {
  return ids.filter((_, i) => i !== index);
}

/** Verschiebt die Übung um eine Position (-1 nach oben, 1 nach unten); am Rand passiert nichts. */
export function moveInTemplate(ids: readonly string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return [...ids];
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
