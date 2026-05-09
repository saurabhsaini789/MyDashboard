"use client";

import { useMemo } from 'react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { calculateSystemPulse, SystemPulseData, PulseDataDependencies } from '@/lib/pulse-logic';

export interface SystemPulse extends SystemPulseData {
  ready: boolean;
}

export function useSystemPulse(initialData?: Partial<PulseDataDependencies>) {
  const medicine    = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_MEDICINE,        initialData?.medicine    || []);
  const travelKit   = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_TRAVEL_KIT,      initialData?.travelKit   || []);
  const aidHome     = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_FIRST_AID_HOME,  initialData?.aidHome     || []);
  const aidMobile   = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_FIRST_AID_MOBILE,initialData?.aidMobile   || []);
  const supplements = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_SUPPLEMENTS,     initialData?.supplements || []);
  const projects    = useStorageSubscription<any[]>(SYNC_KEYS.GOALS_PROJECTS,         initialData?.projects    || []);
  const habits      = useStorageSubscription<any[]>(SYNC_KEYS.HABITS,                 initialData?.habits      || []);
  const channels    = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_BUSINESS,      initialData?.channels    || []);
  const income      = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_INCOME,        initialData?.income      || []);
  const expenses    = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_EXPENSES,      initialData?.expenses    || []);
  const journals    = useStorageSubscription<string[]>(SYNC_KEYS.JOURNAL_LOGS,        initialData?.journals    || []);

  const pulse = useMemo(() => {
    const data: PulseDataDependencies = {
      medicine,
      travelKit,
      aidHome,
      aidMobile,
      supplements,
      projects,
      habits,
      channels,
      income,
      expenses,
      journals,
    };

    const calculated = calculateSystemPulse(data);

    return {
      ...calculated,
      ready: true
    };
  }, [medicine, travelKit, aidHome, aidMobile, supplements, projects, habits, channels, income, expenses, journals]);

  return pulse;
}
