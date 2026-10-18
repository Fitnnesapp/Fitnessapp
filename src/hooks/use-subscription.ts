import { useCallback } from 'react';

import { useNow } from '@/hooks/use-now';
import { accessState, canStartTrial, daysLeft, isPremium, type Plan } from '@/lib/logic/entitlements';
import { purchaseProvider } from '@/lib/purchases/provider';
import { useEntitlementStore } from '@/lib/storage/entitlement-store';

/**
 * Einziger Zugangspunkt für Premium-Prüfungen. Features fragen nur `isPremium`,
 * nie den Abo-Stand direkt, damit sich Regeln an einer Stelle ändern lassen.
 */
export function useSubscription() {
  const entitlement = useEntitlementStore((state) => state.entitlement);
  const setEntitlement = useEntitlementStore((state) => state.set);
  // Minütlich prüfen, damit ein ablaufendes Abo ohne Neustart erkannt wird
  const now = useNow(60_000);

  const run = useCallback(
    async (action: (current: typeof entitlement) => Promise<typeof entitlement>) => {
      setEntitlement(await action(useEntitlementStore.getState().entitlement));
    },
    [setEntitlement],
  );

  return {
    isPremium: isPremium(entitlement, now),
    state: accessState(entitlement, now),
    plan: entitlement.plan,
    daysLeft: daysLeft(entitlement, now),
    canStartTrial: canStartTrial(entitlement),
    provider: purchaseProvider,
    startTrial: () => run(purchaseProvider.startTrial),
    purchase: (plan: Plan) => run((current) => purchaseProvider.purchase(current, plan)),
    restore: () => run(purchaseProvider.restore),
    cancel: () => run(purchaseProvider.cancel),
  };
}
