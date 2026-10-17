import { useLocalSearchParams } from 'expo-router';

import { HomeSessionDetail } from '@/components/home-session-detail';
import { WorkoutDetail } from '@/components/workout-detail';
import { useHomeSessions } from '@/lib/storage/home-store';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isHomeSession = useHomeSessions((state) => state.sessions.some((s) => s.id === id));

  return isHomeSession ? <HomeSessionDetail sessionId={id} /> : <WorkoutDetail workoutId={id} />;
}
