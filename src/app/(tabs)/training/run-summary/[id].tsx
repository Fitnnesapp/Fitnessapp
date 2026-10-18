import { useLocalSearchParams } from 'expo-router';

import { RunDetail } from '@/components/run-detail';

export default function RunSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RunDetail runId={id} justFinished />;
}
