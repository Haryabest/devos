import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';

export interface FigmaCacheEntry {
  url: string;
  title?: string;
  thumbnailUrl?: string;
  fetchedAt: string;
}

interface FigmaState {
  cache: Record<string, FigmaCacheEntry>;
  ensureCached: (url: string) => Promise<FigmaCacheEntry | null>;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchFigmaOembed(url: string): Promise<{ title?: string; thumbnail_url?: string }> {
  const res = await fetch(
    `https://www.figma.com/api/oembed?url=${encodeURIComponent(url)}`,
  );
  if (!res.ok) throw new Error('Не удалось загрузить превью Figma');
  return res.json() as Promise<{ title?: string; thumbnail_url?: string }>;
}

export const useFigmaStore = create<FigmaState>()(
  persist(
    (set, get) => ({
      cache: {},

      ensureCached: async (url) => {
        const trimmed = url.trim();
        if (!trimmed) return null;

        const existing = get().cache[trimmed];
        if (
          existing &&
          Date.now() - new Date(existing.fetchedAt).getTime() < CACHE_TTL_MS
        ) {
          return existing;
        }

        try {
          const data = await fetchFigmaOembed(trimmed);
          const entry: FigmaCacheEntry = {
            url: trimmed,
            title: data.title,
            thumbnailUrl: data.thumbnail_url,
            fetchedAt: new Date().toISOString(),
          };
          set((s) => ({ cache: { ...s.cache, [trimmed]: entry } }));
          return entry;
        } catch {
          if (existing) return existing;
          return null;
        }
      },
    }),
    {
      name: 'devos:figma',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:figma')),
      version: 1,
    },
  ),
);
