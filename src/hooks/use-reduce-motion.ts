import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true, wenn in den Systemeinstellungen "Bewegung reduzieren" aktiv ist. Dann keine Animationen. */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduceMotion(value);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
