import { useLocalSearchParams } from 'expo-router';

import { HomeSessionDetail } from '@/components/home-session-detail';

export default function HomeSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HomeSessionDetail sessionId={id} justFinished />;
}
