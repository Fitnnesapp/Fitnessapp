import { useEffect, useState } from 'react';

/** Liefert die aktuelle Zeit und aktualisiert sich im Intervall, solange `active` gesetzt ist. */
export function useNow(intervalMs = 1000, active = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    // Sofort einmal aktualisieren, damit nach einer Pause keine veraltete Zeit angezeigt wird
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [intervalMs, active]);

  return now;
}
