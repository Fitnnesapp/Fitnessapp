/** Ein aufgezeichneter GPS-Punkt. Zeitabläufe nutzen `e` (aktive Zeit), damit Pausen nichts verfälschen. */
export type TrackPoint = {
  lat: number;
  lng: number;
  /** Zeitstempel der Messung (ms seit 1970) */
  t: number;
  /** Aktive Laufzeit in ms bis zu diesem Punkt, ohne Pausen */
  e: number;
  alt: number | null;
  /** Genauigkeit der Messung in Metern */
  acc: number | null;
};

/** Rohmessung aus dem GPS, bevor Aktivzeit und Filter angewendet werden. */
export type RawLocation = {
  lat: number;
  lng: number;
  t: number;
  alt: number | null;
  acc: number | null;
};

export type RunStatus = 'running' | 'paused';

export type ActiveRun = {
  id: string;
  startedAt: number;
  status: RunStatus;
  /** Bis zur letzten Pause angesammelte aktive Zeit in ms */
  elapsedBase: number;
  /** Zeitpunkt, seit dem die aktive Zeit läuft. null, solange pausiert. */
  runningSince: number | null;
  points: TrackPoint[];
  distanceM: number;
};

/** Beste Zeiten über feste Distanzen in Sekunden, null wenn der Lauf kürzer war. */
export type RunBests = {
  k1: number | null;
  k5: number | null;
  k10: number | null;
};

export type RunSession = {
  id: string;
  type: 'running';
  startedAt: number;
  endedAt: number;
  distanceM: number;
  durationSeconds: number;
  elevationGainM: number;
  bests: RunBests;
  points: TrackPoint[];
};

export type RunRecordType = 'longest_distance' | 'fastest_1k' | 'fastest_5k' | 'fastest_10k';

export type KmSplit = {
  km: number;
  seconds: number;
};
