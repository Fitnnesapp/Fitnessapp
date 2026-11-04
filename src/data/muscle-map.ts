import type { MuscleGroup } from '@/types/workout';

/**
 * Stilisierte Körperkarte (vorne und hinten) für die Muskelanzeige. Eigene Zeichnung.
 * Alle Pfade beschreiben die linke Bildhälfte und werden für die rechte Seite gespiegelt.
 * Koordinaten im Raster 100 × 220, nur absolute Pfadbefehle (siehe mirrorPath).
 */
export type MuscleShape = { muscle: MuscleGroup; d: string };

export const MAP_WIDTH = 100;
export const MAP_HEIGHT = 220;

export const HEAD = 'M50 3 C57 3 61 9 61 16 C61 24 57 29 50 29 C43 29 39 24 39 16 C39 9 43 3 50 3 Z';

/** Körperumriss, linke Hälfte bis zur Mittellinie */
export const BODY_HALF =
  'M50 28 L45 29 L45 34 C38 36 30 36 25 40 C19 44 18 52 18 60 L15 84 C13 92 12 104 12 112 ' +
  'C11 118 12 124 14 126 C17 126 18 120 18 114 C19 104 22 94 24 86 L27 66 L30 70 ' +
  'C31 80 33 92 32 104 C30 112 30 122 31 132 C32 148 33 160 33 168 C32 180 33 196 35 208 ' +
  'C35 212 33 216 36 217 L45 217 C45 212 44 208 44 204 C45 192 46 178 46 168 C47 156 48 140 49 124 L50 122 Z';

const DELT = 'M27 39 C22 41 19 47 19 55 C21 58 24 58 26 56 C27 50 30 45 34 42 C32 40 30 39 27 39 Z';
const UPPER_ARM = 'M21 59 C19 64 18 72 19 78 C21 81 24 80 25 77 C26 71 27 64 26 59 C25 57 22 57 21 59 Z';
const FOREARM = 'M18 83 C16 90 14 100 14 109 C15 112 18 112 19 109 C20 101 22 92 24 86 C23 82 19 81 18 83 Z';

export const FRONT: readonly MuscleShape[] = [
  { muscle: 'Schultern', d: DELT },
  { muscle: 'Brust', d: 'M49 42 C44 40 37 40 33 43 C30 47 29 53 31 58 C36 62 44 62 49 58 Z' },
  { muscle: 'Bizeps', d: UPPER_ARM },
  { muscle: 'Unterarme', d: FOREARM },
  { muscle: 'Bauch', d: 'M49 63 C45 63 41 64 40 66 C39 76 39 88 41 98 C44 102 47 103 49 103 Z' },
  { muscle: 'Bauch', d: 'M38 65 C35 70 33 80 34 92 C35 97 37 99 39 98 C37 88 37 76 38 65 Z' },
  { muscle: 'Beine', d: 'M33 110 C31 122 31 138 33 152 C35 160 39 163 42 161 C45 150 47 134 47 122 C46 115 42 110 33 110 Z' },
  { muscle: 'Waden', d: 'M35 170 C34 180 34 192 36 202 C38 204 40 204 41 201 C43 191 44 180 43 171 C41 168 37 168 35 170 Z' },
];

export const BACK: readonly MuscleShape[] = [
  { muscle: 'Rücken', d: 'M50 30 L46 31 C44 35 38 38 33 40 C39 42 45 45 50 48 Z' },
  { muscle: 'Rücken', d: 'M33 44 C31 54 31 66 35 78 C39 86 45 92 50 94 L50 51 C44 49 38 46 33 44 Z' },
  { muscle: 'Schultern', d: DELT },
  { muscle: 'Trizeps', d: UPPER_ARM },
  { muscle: 'Unterarme', d: FOREARM },
  { muscle: 'Gesäß', d: 'M49 98 C42 97 35 100 33 108 C32 116 35 122 41 123 C45 123 48 121 49 118 Z' },
  { muscle: 'Beine', d: 'M33 126 C32 136 33 148 35 158 C37 162 41 163 43 160 C46 150 47 138 47 128 C44 125 37 124 33 126 Z' },
  { muscle: 'Waden', d: 'M34 168 C32 176 32 186 35 194 C37 197 40 196 42 192 C44 184 45 175 43 168 C40 165 36 165 34 168 Z' },
];
