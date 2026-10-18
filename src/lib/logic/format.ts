/** Dauer als h:mm:ss bzw. m:ss. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');

  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Dauer in Minuten als "1 Std 05 Min" bzw. "42 Min". */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} Min`;
  return `${Math.floor(minutes / 60)} Std ${String(minutes % 60).padStart(2, '0')} Min`;
}

const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
const TIME_FORMAT = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (at: number) => DATE_FORMAT.format(at);
export const formatTime = (at: number) => TIME_FORMAT.format(at);

export { dayKey } from './activity.ts';
