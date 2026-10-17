import type { ConsentKey, ConsentType } from '@/types/database';

/** Version der Datenschutzerklärung, auf die sich Einwilligungen beziehen. Bei Textänderungen erhöhen. */
export const POLICY_VERSION = '2026-10-entwurf';

export type ConsentDefinition = {
  key: ConsentKey;
  type: ConsentType;
  title: string;
  summary: string;
  details: string[];
};

export const CONSENTS: readonly ConsentDefinition[] = [
  {
    key: 'consent_health_data',
    type: 'health_data',
    title: 'Gesundheitsdaten',
    summary: 'Wir speichern deine Trainingsdaten, damit du Fortschritt und Verlauf sehen kannst.',
    details: [
      'Trainingsdaten wie Gewichte, Wiederholungen, Dauer und Herzfrequenz',
      'Körperdaten wie Gewicht und Körperfettanteil, falls du sie einträgst',
      'Diese Daten sind besonders geschützt (Art. 9 DSGVO) und werden nie für Werbung genutzt',
    ],
  },
  {
    key: 'consent_location',
    type: 'location',
    title: 'Standortdaten',
    summary: 'Für das Lauftracking zeichnen wir deine Strecke per GPS auf.',
    details: [
      'Nur während eines aktiven Laufs',
      'Strecke, Distanz, Pace und Höhenmeter',
      'Ohne Einwilligung bleibt das Lauftracking deaktiviert',
    ],
  },
  {
    key: 'consent_marketing',
    type: 'marketing',
    title: 'Neuigkeiten und Angebote',
    summary: 'Gelegentliche Hinweise zu neuen Funktionen und Angeboten.',
    details: ['Freiwillig und ohne Auswirkung auf die Nutzung der App', 'Es werden keine Gesundheitsdaten dafür verwendet'],
  },
];

export type ConsentValues = Record<ConsentKey, boolean>;

export const NO_CONSENT: ConsentValues = {
  consent_health_data: false,
  consent_location: false,
  consent_marketing: false,
};

export function consentTypeOf(key: ConsentKey): ConsentType {
  const definition = CONSENTS.find((c) => c.key === key);
  if (!definition) throw new Error(`Unbekannter Consent-Schlüssel: ${key}`);
  return definition.type;
}
