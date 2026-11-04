import type { Href } from 'expo-router';
import { useMemo } from 'react';

import { CHALLENGES } from '@/data/challenges';
import { EXERCISES, getExercise } from '@/data/exercises';
import { FEATURES } from '@/data/features';
import { PROGRAMS } from '@/data/programs';
import { ROUTINES } from '@/data/routines';
import { useNow } from '@/hooks/use-now';
import { upcomingEvents } from '@/lib/logic/events';
import type { SearchItem } from '@/lib/logic/search';
import { useEvents } from '@/lib/storage/events-store';

export type SearchEntry = SearchItem & { target: { href: Href } | { url: string } };

/** Alles, was die Suche findet: Funktionen, Kraft-Workouts, Übungen, Programme, Challenges und kommende Events. */
export function useSearchIndex(): SearchEntry[] {
  const events = useEvents();
  const now = useNow(60 * 60_000);

  return useMemo(() => {
    const entries: SearchEntry[] = FEATURES.map((f) => ({ ...f, target: { href: f.href as Href } }));

    for (const e of EXERCISES) {
      entries.push({
        id: `uebung-${e.id}`,
        kind: 'uebung',
        title: e.name,
        subtitle: `${e.muscleGroup} · ${e.equipment} · ${e.difficulty}`,
        keywords: [e.instructions],
        target: { href: { pathname: '/training/exercise/[id]', params: { id: e.id } } },
      });
    }

    for (const r of ROUTINES) {
      entries.push({
        id: `workout-${r.id}`,
        kind: 'workout',
        title: r.name,
        subtitle: `Kraft · ${r.focus} · ${r.setting} · ${r.difficulty}`,
        keywords: [r.description, r.focus, r.setting, ...r.items.map((item) => getExercise(item.exerciseId)?.name ?? '')],
        target: { href: { pathname: '/training/routine/[id]', params: { id: r.id } } },
      });
    }

    for (const p of PROGRAMS) {
      entries.push({
        id: `programm-${p.id}`,
        kind: 'programm',
        title: p.name,
        subtitle: `${p.category} · ${p.difficulty} · zu Hause`,
        keywords: [p.description, ...p.steps.map((s) => s.name)],
        target: { href: { pathname: '/training/program/[id]', params: { id: p.id } } },
      });
    }

    for (const c of CHALLENGES) {
      entries.push({
        id: `challenge-${c.id}`,
        kind: 'challenge',
        title: c.name,
        subtitle: `Challenge · ${c.tagline}`,
        keywords: [c.description, 'Challenge', 'Wettbewerb'],
        target: { href: { pathname: '/discover/challenge/[id]', params: { id: c.id } } },
      });
    }

    for (const e of upcomingEvents(events, now)) {
      entries.push({
        id: `event-${e.id}`,
        kind: 'event',
        title: e.name,
        subtitle: `Event · ${e.city} · ${e.date.split('-').reverse().join('.')}`,
        keywords: [...e.distances, e.description, e.kind === 'lauf' ? 'Lauf Rennen' : 'Fitness Wettkampf'],
        target: { url: e.url },
      });
    }
    return entries;
  }, [events, now]);
}
