'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { TideCloakProvider, useTideCloak } from '@tidecloak/nextjs';
import { SpendApiContext } from '@/lib-ui/use-spend-api';
import { createDemoApi, createSpendApi } from '@/lib-ui/api-client';
import { DEMO_IDENTITIES } from '@/lib-ui/demo-identities';
import type { VerificationConfig } from '@/lib/auth';

const DemoSessionContext = createContext<{ identity: string; selectIdentity: (id: string) => void } | null>(null);
export const useDemoSession = () => useContext(DemoSessionContext);

function LiveSession({ children }: { children: ReactNode }) {
  const { getToken } = useTideCloak();
  const api = useMemo(() => createSpendApi(getToken), [getToken]);
  return <SpendApiContext.Provider value={api}>{children}</SpendApiContext.Provider>;
}

function DemoSession({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<string | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem('spend-demo-identity'); } catch { /* Browser storage is optional. */ }
    setIdentity(DEMO_IDENTITIES.find(actor => actor.sub === saved)?.sub ?? DEMO_IDENTITIES[0].sub);
  }, []);
  const api = useMemo(() => createDemoApi(identity ?? ''), [identity]);
  function selectIdentity(id: string) {
    if (!DEMO_IDENTITIES.some(actor => actor.sub === id)) return;
    try { sessionStorage.setItem('spend-demo-identity', id); } catch { /* Keep the selection for this page. */ }
    setIdentity(id);
  }
  if (!identity) return <main className="shell" role="status">Opening local simulation…</main>;
  return <DemoSessionContext.Provider value={{ identity, selectIdentity }}>
    <SpendApiContext.Provider value={api}><div key={identity}>{children}</div></SpendApiContext.Provider>
  </DemoSessionContext.Provider>;
}

export default function SessionProvider({ config, children }: { config: VerificationConfig | null; children: ReactNode }) {
  if (!config) return <DemoSession>{children}</DemoSession>;
  return <TideCloakProvider config={config}><LiveSession>{children}</LiveSession></TideCloakProvider>;
}
