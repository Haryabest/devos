import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';
import { isQuotaExceededError } from '@/lib/storage-limits';
import { scopedStorageKey } from '@/lib/storage-scope';

/** Async IndexedDB persist — не блокирует main thread, без лимита 5 MB localStorage. */
export function createScopedIdbStorage(
  baseKey: string,
  options?: { quotaMessage?: string },
): StateStorage {
  return {
    getItem: async () => {
      const value = await get<string>(scopedStorageKey(baseKey));
      return value ?? null;
    },
    setItem: async (_name, value) => {
      try {
        await set(scopedStorageKey(baseKey), value);
      } catch (e) {
        if (options?.quotaMessage && isQuotaExceededError(e)) {
          window.alert(options.quotaMessage);
        }
      }
    },
    removeItem: async () => {
      await del(scopedStorageKey(baseKey));
    },
  };
}
