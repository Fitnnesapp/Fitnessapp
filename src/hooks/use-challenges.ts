import { useMemo } from 'react';

import { CHALLENGES } from '@/data/challenges';
import { useActivities } from '@/hooks/use-activities';
import { useNow } from '@/hooks/use-now';
import {
  challengeProgress,
  challengeStatus,
  challengeWindow,
  type Challenge,
  type ChallengeProgress,
  type JoinedChallenge,
} from '@/lib/logic/challenges';
import { useChallengeStore } from '@/lib/storage/challenge-store';

export type ChallengeEntry = {
  challenge: Challenge;
  joined?: JoinedChallenge;
  progress?: ChallengeProgress;
};

const DAY_MS = 86400000;

/**
 * Sichtbare Challenges mit Fortschritt: laufende und kommende,
 * dazu beendete, an denen man teilgenommen hat, noch 30 Tage lang.
 * Beigetretene zuerst, dann nach Startdatum.
 */
export function useChallenges(): { entries: ChallengeEntry[]; now: number } {
  const activities = useActivities();
  const joinedMap = useChallengeStore((state) => state.joined);
  const now = useNow(60_000);

  const entries = useMemo(() => {
    const list: ChallengeEntry[] = [];
    for (const challenge of CHALLENGES) {
      const joined = joinedMap[challenge.id];
      const status = challengeStatus(challenge, now, joined);
      if (status === 'ended') {
        const { end } = challengeWindow(challenge, joined?.joinedAt);
        if (!joined || now - end > 30 * DAY_MS) continue;
      }
      list.push({
        challenge,
        joined,
        progress: joined ? challengeProgress(challenge, joined, activities, now) : undefined,
      });
    }
    return list.sort((a, b) => {
      if (!!a.joined !== !!b.joined) return a.joined ? -1 : 1;
      return challengeWindow(a.challenge, a.joined?.joinedAt).start - challengeWindow(b.challenge, b.joined?.joinedAt).start;
    });
  }, [activities, joinedMap, now]);

  return { entries, now };
}
