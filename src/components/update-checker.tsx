import { useEffect } from 'react';
import { AppState } from 'react-native';

import { checkForAppUpdate, updatesActive } from '@/lib/updates';

/** Fragt beim Start und bei jeder Rückkehr in die App (höchstens alle 30 Minuten) nach einer neuen Version. */
export function UpdateChecker() {
  useEffect(() => {
    if (!updatesActive) return;
    void checkForAppUpdate();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkForAppUpdate();
    });
    return () => subscription.remove();
  }, []);
  return null;
}
