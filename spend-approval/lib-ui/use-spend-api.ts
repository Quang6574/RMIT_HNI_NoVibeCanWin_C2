'use client';
import { useMemo } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import { createSpendApi } from './api-client';

export function useSpendApi() {
  const { getToken } = useTideCloak();
  return useMemo(() => createSpendApi(getToken), [getToken]);
}
