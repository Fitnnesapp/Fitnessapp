import type { Program, Segment } from '../../types/home.ts';

export const PREPARE_SECONDS = 5;

/**
 * Baut den kompletten Ablauf eines Programms: kurze Vorbereitung, dann je Runde alle Übungen
 * mit Pausen dazwischen. Nach der allerletzten Übung folgt keine Pause.
 */
export function buildTimeline(program: Program, prepareSeconds = PREPARE_SECONDS): Segment[] {
  const segments: Segment[] = [];
  const first = program.steps[0];
  if (!first) return segments;

  if (prepareSeconds > 0) {
    segments.push({ kind: 'prepare', seconds: prepareSeconds, exerciseIndex: 0, round: 0, step: first });
  }

  let exerciseIndex = 0;
  for (let round = 0; round < program.rounds; round++) {
    program.steps.forEach((step, i) => {
      segments.push({
        kind: 'work',
        seconds: step.seconds ?? program.workSeconds,
        exerciseIndex,
        round,
        step,
      });

      const isLast = round === program.rounds - 1 && i === program.steps.length - 1;
      if (!isLast && program.restSeconds > 0) {
        // Während der Pause wird die nächste Übung angekündigt
        const next = program.steps[(i + 1) % program.steps.length];
        segments.push({ kind: 'rest', seconds: program.restSeconds, exerciseIndex, round, step: next });
      }
      exerciseIndex += 1;
    });
  }

  return segments;
}

export const totalSeconds = (timeline: Segment[]): number => timeline.reduce((sum, s) => sum + s.seconds, 0);

export const exerciseCount = (program: Program): number => program.steps.length * program.rounds;

/** Dauer des Programms in Minuten ohne Vorbereitung, auf ganze Minuten gerundet (mindestens 1). */
export function programMinutes(program: Program): number {
  const seconds = totalSeconds(buildTimeline(program, 0));
  return Math.max(1, Math.round(seconds / 60));
}

export type Position = {
  index: number;
  segment: Segment;
  remainingMs: number;
};

/** Bestimmt den Abschnitt zur verstrichenen Zeit, oder null wenn der Ablauf zu Ende ist. */
export function locate(timeline: Segment[], elapsedMs: number): Position | null {
  let start = 0;

  for (let index = 0; index < timeline.length; index++) {
    const end = start + timeline[index].seconds * 1000;
    if (elapsedMs < end) return { index, segment: timeline[index], remainingMs: end - elapsedMs };
    start = end;
  }
  return null;
}

/** Trainierte Sekunden zur verstrichenen Zeit, ohne die Vorbereitung, begrenzt auf die Gesamtdauer. */
export function activeSecondsAt(timeline: Segment[], elapsedMs: number): number {
  const prepare = timeline[0]?.kind === 'prepare' ? timeline[0].seconds : 0;
  const total = totalSeconds(timeline);
  const elapsedSeconds = Math.min(elapsedMs / 1000, total);
  return Math.max(0, Math.floor(elapsedSeconds - prepare));
}
