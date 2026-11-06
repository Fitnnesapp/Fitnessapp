import { useMemo } from 'react';

import { getProgram } from '@/data/programs';
import { weekStart } from '@/lib/logic/activity';
import { enduranceIntensity, weeklyBenefit, type BenefitEntry, type WeeklyBenefit } from '@/lib/logic/health-benefit';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';
import { useWorkouts } from '@/lib/storage/workout-store';

/** Gesundheits-Nutzen der laufenden Woche aus allen drei Trainingsarten. */
export function useWeeklyBenefit(now: number): WeeklyBenefit {
  const strength = useWorkouts((state) => state.history);
  const home = useHomeSessions((state) => state.sessions);
  const runs = useRunStore((state) => state.history);
  const start = weekStart(now);

  return useMemo(() => {
    const entries: BenefitEntry[] = [
      ...strength.map((w) => ({
        startedAt: w.startedAt,
        durationSeconds: Math.max(0, Math.round((w.endedAt - w.startedAt) / 1000)),
        intensity: 'keine' as const,
        strengthening: true,
      })),
      ...home.map((s) => {
        const category = getProgram(s.programId)?.category;
        return {
          startedAt: s.startedAt,
          durationSeconds: s.activeSeconds,
          intensity: category === 'HIIT' ? ('intensiv' as const) : category === 'Ganzkörper' ? ('moderat' as const) : ('keine' as const),
          strengthening: category === 'Ganzkörper' || category === 'Core',
        };
      }),
      ...runs.map((r) => ({
        startedAt: r.startedAt,
        durationSeconds: r.durationSeconds,
        intensity: enduranceIntensity(r.sport ?? 'run', r.distanceM, r.durationSeconds),
        strengthening: false,
      })),
    ];
    return weeklyBenefit(entries, start);
  }, [strength, home, runs, start]);
}
