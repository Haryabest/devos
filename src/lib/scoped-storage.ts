import type { StateStorage } from 'zustand/middleware';
import { isQuotaExceededError } from '@/lib/storage-limits';
import { readScopedItem, removeScopedItem, writeScopedItem } from '@/lib/storage-scope';

export function createScopedPersistStorage(
  baseKey: string,
  options?: { quotaMessage?: string },
): StateStorage {
  return {
    getItem: () => readScopedItem(baseKey),
    setItem: (_name, value) => {
      try {
        writeScopedItem(baseKey, value);
      } catch (e) {
        if (options?.quotaMessage && isQuotaExceededError(e)) {
          window.alert(options.quotaMessage);
        }
      }
    },
    removeItem: () => removeScopedItem(baseKey),
  };
}
