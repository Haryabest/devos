import { useEffect, useState } from 'react';
import { ensureWorkspaceHydrated } from '@/lib/reset-workspace-stores';
import { useAuthStore } from '@/stores/auth-store';

export function useWorkspaceHydration() {
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    let cancelled = false;

    const hydrateWorkspace = async () => {
      await ensureWorkspaceHydrated();
      if (!cancelled) setReady(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      void hydrateWorkspace();
      return () => {
        cancelled = true;
      };
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      void hydrateWorkspace();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return ready;
}
