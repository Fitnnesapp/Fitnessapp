import { Redirect } from 'expo-router';

import { usePlanStore } from '@/lib/storage/plan-store';

/** Beim ersten Öffnen geht es zum persönlichen Plan, danach direkt zum Start-Bildschirm. */
export default function Index() {
  const onboardingDone = usePlanStore((state) => state.onboardingDone);
  return <Redirect href={onboardingDone ? '/dashboard' : '/plan/setup'} />;
}
