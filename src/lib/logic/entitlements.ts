export type Plan = 'monthly' | 'yearly';

export type EntitlementStatus = 'none' | 'trial' | 'active' | 'canceled';

/** Was der Nutzer gerade besitzt. Wird lokal gespeichert und vom Kauf-Anbieter aktualisiert. */
export type Entitlement = {
  status: EntitlementStatus;
  plan: Plan | null;
  /** Die Testversion gibt es nur einmal */
  trialUsed: boolean;
  trialEndsAt: number | null;
  /** Ende des bezahlten Zeitraums bzw. nächste Verlängerung */
  renewsAt: number | null;
};

export const NO_ENTITLEMENT: Entitlement = {
  status: 'none',
  plan: null,
  trialUsed: false,
  trialEndsAt: null,
  renewsAt: null,
};

export const TRIAL_DAYS = 7;
const DAY_MS = 86400000;
const PLAN_DAYS: Record<Plan, number> = { monthly: 30, yearly: 365 };

/** Anzeigestatus für die Oberfläche. */
export type AccessState = 'free' | 'trial' | 'premium' | 'premium_ending' | 'expired';

export function accessState(e: Entitlement, now: number): AccessState {
  if (e.status === 'trial') {
    return e.trialEndsAt !== null && now < e.trialEndsAt ? 'trial' : 'expired';
  }
  if (e.status === 'active') {
    // Verlängert der Anbieter nicht, läuft der Zeitraum ab
    return e.renewsAt === null || now < e.renewsAt ? 'premium' : 'expired';
  }
  if (e.status === 'canceled') {
    return e.renewsAt !== null && now < e.renewsAt ? 'premium_ending' : 'expired';
  }
  return 'free';
}

export function isPremium(e: Entitlement, now: number): boolean {
  const state = accessState(e, now);
  return state === 'trial' || state === 'premium' || state === 'premium_ending';
}

export function canStartTrial(e: Entitlement): boolean {
  return !e.trialUsed && e.status !== 'active' && e.status !== 'trial';
}

/** Startet die Testversion, oder gibt null zurück, wenn sie nicht (mehr) verfügbar ist. */
export function startTrial(e: Entitlement, now: number): Entitlement | null {
  if (!canStartTrial(e)) return null;
  return { ...e, status: 'trial', plan: null, trialUsed: true, trialEndsAt: now + TRIAL_DAYS * DAY_MS, renewsAt: null };
}

export function purchase(e: Entitlement, plan: Plan, now: number): Entitlement {
  return { ...e, status: 'active', plan, trialEndsAt: null, renewsAt: now + PLAN_DAYS[plan] * DAY_MS };
}

/** Kündigung: der Zugang bleibt bis zum Ende des bezahlten Zeitraums. */
export function cancel(e: Entitlement): Entitlement {
  return e.status === 'active' ? { ...e, status: 'canceled' } : e;
}

/** Verbleibende ganze Tage bis zum Ende von Testversion oder Zeitraum, oder null. */
export function daysLeft(e: Entitlement, now: number): number | null {
  const end = e.status === 'trial' ? e.trialEndsAt : e.renewsAt;
  if (end === null || end <= now) return null;
  return Math.ceil((end - now) / DAY_MS);
}
