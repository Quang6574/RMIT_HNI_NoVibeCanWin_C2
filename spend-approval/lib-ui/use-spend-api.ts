'use client';
import { createContext, useContext } from 'react';
import type { createSpendApi } from './api-client';

export const SpendApiContext = createContext<ReturnType<typeof createSpendApi> | null>(null);

export function useSpendApi() {
  const api = useContext(SpendApiContext);
  if (!api) throw new Error('Spending session is unavailable.');
  return api;
}
