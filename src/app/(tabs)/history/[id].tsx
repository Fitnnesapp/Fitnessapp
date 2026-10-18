import { useLocalSearchParams } from 'expo-router';

import { HomeSessionDetail } from '@/components/home-session-detail';
import { RunDetail } from '@/components/run-detail';
import { WorkoutDetail } from '@/components/workout-detail';
import { useHomeSessions } from '@/lib/storage/home-store';
import { useRunStore } from '@/lib/storage/run-store';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isHomeSession = useHomeSessions((state) => state.sessions.some((s) => s.id === id));
  const isRun = useRunStore((state) => state.history.some((r) => r.id === id));

  if (isHomeSession) return <HomeSessionDetail sessionId={id} />;
  if (isRun) return <RunDetail runId={id} />;
  return <WorkoutDetail workoutId={id} />;
}
