import { useLocalSearchParams } from 'expo-router';

import { WorkoutDetail } from '@/components/workout-detail';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkoutDetail workoutId={id} justFinished />;
}
