import { consentTypeOf, POLICY_VERSION, type ConsentValues } from '@/lib/logic/consent';
import type { ConsentKey, Profile } from '@/types/database';

import { supabase } from './client';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

async function logConsents(userId: string, entries: { key: ConsentKey; granted: boolean }[]): Promise<void> {
  const { error } = await supabase.from('consent_log').insert(
    entries.map(({ key, granted }) => ({
      user_id: userId,
      consent_type: consentTypeOf(key),
      granted,
      policy_version: POLICY_VERSION,
    })),
  );
  if (error) throw error;
}

/** Schließt den Consent-Flow ab: speichert alle drei Einwilligungen samt Zeitstempel und Nachweis. */
export async function completeConsent(userId: string, values: ConsentValues): Promise<void> {
  const now = new Date().toISOString();

  // upsert statt update: legt das Profil an, falls der Registrierungs-Trigger es nicht erzeugt hat
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...values, consent_given_at: now, consent_completed_at: now });
  if (error) throw error;

  await logConsents(
    userId,
    (Object.keys(values) as ConsentKey[]).map((key) => ({ key, granted: values[key] })),
  );
}

/** Ändert eine einzelne Einwilligung (z.B. Widerruf in den Einstellungen). */
export async function setConsent(userId: string, key: ConsentKey, granted: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ [key]: granted, consent_given_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;

  await logConsents(userId, [{ key, granted }]);
}
