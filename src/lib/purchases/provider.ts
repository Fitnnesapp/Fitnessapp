import type { Entitlement, Plan } from '@/lib/logic/entitlements';
import { cancel, purchase, startTrial } from '@/lib/logic/entitlements';

/**
 * Schnittstelle zum Zahlungsanbieter (z.B. RevenueCat für Apple und Google).
 * Jede Methode bekommt den aktuellen Stand und liefert den neuen. So bleibt die Oberfläche unabhängig vom Anbieter.
 * Fehler werden als Exception mit verständlicher Meldung geworfen.
 */
export type PurchaseProvider = {
  /** true, wenn Käufe wirklich möglich sind. Sonst zeigt die Paywall einen Hinweis. */
  available: boolean;
  /** Kennzeichnet den Test-Anbieter, damit die Oberfläche klar sagt, dass nichts bezahlt wird */
  simulated: boolean;
  startTrial: (current: Entitlement) => Promise<Entitlement>;
  purchase: (current: Entitlement, plan: Plan) => Promise<Entitlement>;
  /** Fragt beim Store nach bestehenden Käufen. Gibt den wiederhergestellten Stand zurück. */
  restore: (current: Entitlement) => Promise<Entitlement>;
  cancel: (current: Entitlement) => Promise<Entitlement>;
};

/** Test-Anbieter ohne Zahlung. Nur in Entwicklungs-Builds aktiv, damit die Paywall ohne Store-Konten testbar ist. */
const simulatedProvider: PurchaseProvider = {
  available: true,
  simulated: true,
  startTrial: async (current) => {
    const next = startTrial(current, Date.now());
    if (!next) throw new Error('Die Testversion wurde bereits genutzt.');
    return next;
  },
  purchase: async (current, plan) => purchase(current, plan, Date.now()),
  restore: async (current) => current,
  cancel: async (current) => cancel(current),
};

/** In Release-Builds, solange kein echter Anbieter angebunden ist, sind Käufe nicht möglich. */
const unavailableProvider: PurchaseProvider = {
  available: false,
  simulated: false,
  startTrial: async () => {
    throw new Error('Käufe sind noch nicht eingerichtet.');
  },
  purchase: async () => {
    throw new Error('Käufe sind noch nicht eingerichtet.');
  },
  restore: async () => {
    throw new Error('Käufe sind noch nicht eingerichtet.');
  },
  cancel: async () => {
    throw new Error('Käufe sind noch nicht eingerichtet.');
  },
};

// Hier später den RevenueCat-Anbieter einhängen, siehe docs/premium.md
export const purchaseProvider: PurchaseProvider = __DEV__ ? simulatedProvider : unavailableProvider;
