/**
 * Lauf-Ideen für Abwechslung. Grundlage ist das polarisierte Training (Seiler 2010):
 * etwa 80 % locker, 20 % intensiv. Eigene Formulierungen.
 */
export type RunIdea = {
  id: string;
  name: string;
  minutes: string;
  intensity: 'Locker' | 'Mittel' | 'Hart';
  how: string;
  why: string;
};

export const RUN_IDEAS: readonly RunIdea[] = [
  {
    id: 'locker',
    name: 'Lockerer Dauerlauf',
    minutes: '30–45 Min',
    intensity: 'Locker',
    how: 'So langsam, dass du dich noch in ganzen Sätzen unterhalten könntest.',
    why: 'Baut die Grundlagenausdauer auf und sollte rund 80 % deiner Läufe ausmachen.',
  },
  {
    id: 'intervalle',
    name: 'Intervalle 6 × 400 m',
    minutes: '35 Min',
    intensity: 'Hart',
    how: '10 Min einlaufen, dann 6 × 400 m zügig mit 2 Min Gehpause, 10 Min auslaufen.',
    why: 'Hebt die maximale Sauerstoffaufnahme, macht dich auf allen Strecken schneller.',
  },
  {
    id: 'tempo',
    name: 'Tempodauerlauf',
    minutes: '30 Min',
    intensity: 'Mittel',
    how: '10 Min locker, 15 Min „angenehm schwer“ (nur noch kurze Sätze möglich), 5 Min locker.',
    why: 'Verschiebt die Schwelle, ab der du übersäuerst. Ideal für 5 und 10 km.',
  },
  {
    id: 'lang',
    name: 'Langer Lauf',
    minutes: '60–90 Min',
    intensity: 'Locker',
    how: 'Einmal pro Woche deutlich länger als sonst, im ruhigen Plaudertempo.',
    why: 'Trainiert Fettstoffwechsel und Durchhaltevermögen für Halbmarathon und mehr.',
  },
];
